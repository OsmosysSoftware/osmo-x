import { gql } from 'apollo-angular';

export const GetNotifications = gql`
  query {
    notifications(options: { limit: 100, sortBy: "createdOn", sortOrder: DESC }) {
      notifications {
        channelType
        createdBy
        createdOn
        data
        deliveryStatus
        id
        result
        status
        updatedBy
        updatedOn
      }
    }
  }
`;

export const LoginUser = gql`
  mutation LoginUser($username: String!, $password: String!) {
    login(loginUserInput: { username: $username, password: $password }) {
      token
      user
    }
  }
`;
