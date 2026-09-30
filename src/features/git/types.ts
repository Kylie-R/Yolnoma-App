export type GitChange = {
  path: string;
  status: string;
  diff: string;
};

export type GitCommit = {
  hash: string;
  author: string;
  date: string;
  message: string;
};
