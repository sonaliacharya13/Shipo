// src/apollo.js
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

export const client = new ApolloClient({
  link: new HttpLink({
    uri: 'https://giants-connectors-stable-equality.trycloudflare.com/graphql',
  }),
  cache: new InMemoryCache(),
});