import { gql } from 'apollo-angular';

export const GetNotifcations = gql`
  query {
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
`;
