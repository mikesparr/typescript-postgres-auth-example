import {
  handleBodyRequestParsing,
  handleCompression,
  handleCors,
} from "./common";

import { handleAPIDocs } from "./apiDocs";

export default [
  handleAPIDocs,
  handleCors,
  handleBodyRequestParsing,
  handleCompression,
];
