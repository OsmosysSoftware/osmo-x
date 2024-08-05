import { gql } from 'apollo-angular';

export const GetNotifications = gql`
  query GetNotifications($limit: Int!, $offset: Int!, $filters: [UniversalFilter!]) {
    notifications(
      options: {
        limit: $limit
        offset: $offset
        sortBy: "createdOn"
        sortOrder: DESC
        filters: $filters
      }
    ) {
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
      total
      offset
      limit
    }
  }
`;

export const LoginUser = gql`
  mutation LoginUser($username: String!, $password: String!) {
    login(loginUserInput: { username: $username, password: $password }) {
      token
      user
      allKeys {
        apiKeyId
        apiKey
        applicationId
        applicationDetails {
          name
        }
        status
      }
    }
  }
`;
