import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client/react';
import { App } from './App';
import { apolloClient } from './lib/apollo-client';
import { ErrorBoundary } from './components/shared/error-boundary';
import './lib/i18n';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ApolloProvider client={apolloClient}>
        <App />
      </ApolloProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
