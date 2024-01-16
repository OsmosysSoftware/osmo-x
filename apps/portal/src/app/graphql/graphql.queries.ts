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

export const LoginUser = gql`
  mutation LoginUser($username: String!, $password: String!) {
    login(loginUserInput: { username: $username, password: $password }) {
      token
      user
    }
  }
`;
