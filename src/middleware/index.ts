import {
  handleBodyRequestParsing,
  handleCompression,
  handleCors,
} from "./common";

export default [handleCors, handleBodyRequestParsing, handleCompression];
