import React from 'react';

export default function (Page) {
  return () => (
    <div className="form-background">
      <Page />
    </div>
  );
}