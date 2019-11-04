import React from 'react';
import Router from 'next/router';

class Index extends React.Component {
  static async getInitialProps({ res }) {
    if (res) {
      res.writeHead(302, {
        location: '/login'
      });
      res.end();
    } else {
      Router.push('/login');
    }

    return {};
  }
}

export default Index;