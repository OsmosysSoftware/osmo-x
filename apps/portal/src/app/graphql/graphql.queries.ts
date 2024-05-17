import { gql } from 'apollo-angular';

export const GetNotifications = gql`
  query GetNotifications($filters: [UniversalFilter!]) {
    notifications(
      options: { limit: 100, sortBy: "createdOn", sortOrder: DESC, filters: $filters }
    ) {
      notifications {
        applicationId
        channelType
        createdBy
        createdOn
        data
        deliveryStatus
        id
        providerId
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
