const express = require('express');
const bodyParser = require('body-parser');
const co = require('co');
const next = require('next');
const { ApolloServer } = require('apollo-server-express');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const config = require('./config/');
const repositories = require('./repositories/');
const apiRoute = require('./api/routes/');
const { resolvers, typeDefs } = require('./graphql/');
const { requestMiddleware } = require('./middlewares/');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
let morganFormat = ':method :url :status :res[content-length] - :response-time ms';
if (process.env.NODE_ENV === 'production')
  morganFormat = 'combined';

co(function * () {
  process.on('uncaughtException', err => {
    console.error('Unhandled Exception', err);
  });

  process.on('uncaughtRejection', (err, promise) => {
    console.error('Unhandled Rejection', err);
  });

  yield nextApp.prepare();

  const { db, logger } = yield config.initialize();
  const repos = yield repositories.initialize({ db });

  const app = express();

  app.use(cookieParser());
  app.use(helmet());
  app.use(morgan(morganFormat, { stream: logger.stream }));
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(express.static('public'));

  app.get(['/', '/home'], (req, res) => res.redirect('/login'));

  app.use((req, res, next) => {
    req.db = db;
    req.repos = repos;
    req.logger = logger;
    next();
  })

  app.use(requestMiddleware.wirePreRequest);
  app.use('/api/', apiRoute);

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const token = req.cookies.token;
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = repos.Account.findByUsername({ username: payload.username });

      return { db: db, repos: repos, user, logger };
    }
  });

  apolloServer.applyMiddleware({ app });

  app.use(requestMiddleware.wirePostRequest);

  app.get('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = global.configuration.server.port;

  app.listen(PORT, () => {
    logger.info(`ApolloServer is now ready at ${apolloServer.graphqlPath}`);
    logger.info(`Server is now listening on PORT: ${PORT}`);
  });

}).catch(error => console.error(error.stack));