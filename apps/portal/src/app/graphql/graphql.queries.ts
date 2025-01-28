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

export const GetArchivedNotifications = gql`
  query GetArchivedNotifications($limit: Int!, $offset: Int!, $filters: [UniversalFilter!]) {
    archivedNotifications(
      options: {
        limit: $limit
        offset: $offset
        sortBy: "createdOn"
        sortOrder: DESC
        filters: $filters
      }
    ) {
      archivedNotifications {
        channelType
        createdBy
        createdOn
        data
        deliveryStatus
        notificationId
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

export const GetProvidersAndNotifications = gql`
  query GetProvidersAndNotifications(
    $providerLimit: Int!
    $providerOffset: Int!
    $providerFilters: [UniversalFilter!]
    $notificationLimit: Int!
    $notificationOffset: Int!
    $notificationFilters: [UniversalFilter!]
  ) {
    providers(
      options: {
        limit: $providerLimit
        offset: $providerOffset
        sortBy: "createdOn"
        sortOrder: ASC
        filters: $providerFilters
      }
    ) {
      providers {
        applicationId
        channelType
        createdOn
        name
        providerId
        status
        updatedOn
      }
      total
      offset
      limit
    }
    notifications(
      options: {
        limit: $notificationLimit
        offset: $notificationOffset
        sortBy: "createdOn"
        sortOrder: DESC
        filters: $notificationFilters
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

export const GetProvidersAndArchivedNotifications = gql`
  query GetProvidersAndArchivedNotifications(
    $providerLimit: Int!
    $providerOffset: Int!
    $providerFilters: [UniversalFilter!]
    $notificationLimit: Int!
    $notificationOffset: Int!
    $notificationFilters: [UniversalFilter!]
  ) {
    providers(
      options: {
        limit: $providerLimit
        offset: $providerOffset
        sortBy: "createdOn"
        sortOrder: ASC
        filters: $providerFilters
      }
    ) {
      providers {
        applicationId
        channelType
        createdOn
        name
        providerId
        status
        updatedOn
      }
      total
      offset
      limit
    }
    archivedNotifications(
      options: {
        limit: $notificationLimit
        offset: $notificationOffset
        sortBy: "createdOn"
        sortOrder: DESC
        filters: $notificationFilters
      }
    ) {
      archivedNotifications {
        channelType
        createdBy
        createdOn
        data
        deliveryStatus
        notificationId
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
