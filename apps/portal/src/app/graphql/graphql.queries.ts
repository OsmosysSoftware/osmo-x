import { gql } from 'apollo-angular';

export const GetNotifications = gql`
  query GetNotifications($filters: [UniversalFilter!]) {
    notifications(
      options: { limit: 100, sortBy: "createdOn", sortOrder: DESC, filters: $filters }
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
