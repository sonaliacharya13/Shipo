import { gql } from '@apollo/client/core';

export const DEFAULT_CHECKLIST_STEPS = [
  { id: 1, label: "Complete development" },
  { id: 2, label: "Run tests" },
  { id: 3, label: "Fix bugs" },
  { id: 4, label: "Create production build" },
  { id: 5, label: "Deploy application" },
  { id: 6, label: "Verify deployment" },
  { id: 7, label: "Update documentation" },
  { id: 8, label: "Announce release" },
];

export const GET_RELEASES = gql`
  query GetReleases {
    releases {
      id
      name
      date
      additionalInfo
      completedSteps
      status
    }
  }
`;

export const CREATE_RELEASE = gql`
  mutation CreateRelease($input: CreateReleaseInput!) {
    createRelease(input: $input) {
      id
      name
      date
      additionalInfo
      completedSteps
      status
    }
  }
`;

export const UPDATE_CHECKLIST = gql`
  mutation UpdateChecklist($id: ID!, $completedSteps: [Int!]!) {
    updateChecklist(id: $id, completedSteps: $completedSteps) {
      id
      completedSteps
      status
    }
  }
`;

export const UPDATE_ADDITIONAL_INFO = gql`
  mutation UpdateAdditionalInfo($id: ID!, $additionalInfo: String) {
    updateAdditionalInfo(id: $id, additionalInfo: $additionalInfo) {
      id
      additionalInfo
    }
  }
`;

export const DELETE_RELEASE = gql`
  mutation DeleteRelease($id: ID!) {
    deleteRelease(id: $id)
  }
`;