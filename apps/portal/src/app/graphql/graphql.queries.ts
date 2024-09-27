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

export const GetApplications = gql`
  query GetApplications($limit: Int!, $offset: Int!, $filters: [UniversalFilter!]) {
    applications(
      options: {
        limit: $limit
        offset: $offset
        sortBy: "createdOn"
        sortOrder: ASC
        filters: $filters
      }
    ) {
      applications {
        applicationId
        createdOn
        name
        status
        updatedOn
        userId
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
    }
  }
`;
