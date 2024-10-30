export interface Application {
  applicationId: number;
  name: string;
  userId: number;
  createdOn: Date;
  updatedOn: Date;
  status: number;
}

export interface ApplicationResponse {
  applications: Application[];
  total: number;
  offset: number;
  limit: number;
}
