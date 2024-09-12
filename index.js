// Importing required modules
const path = require("path"); // Used for handling and transforming file paths
const fs = require("fs"); // File system module for file operations

// Custom error class for FdyTmp
class FdyTmpError extends Error {
  /**
   * Constructs a new FdyTmpError instance
   * @param {string} message - Error message to be displayed
   */
  constructor(message) {
    super(message); // Initialize the base Error class with the message
    this.name = "FdyTmpError"; // Set a specific error name for easier identification
  }
}

// Main FdyTmp class for managing temporary files
class FdyTmp {
  static json = {}; // Stores JSON data to be saved or retrieved
  static content = ""; // Stores text content to be saved or retrieved
  static isJson = false; // Flag to indicate whether data is JSON
  static tmpPath = "tmp"; // Default path for temporary files
  static fileName = "fdytmp.tmp"; // Default file name for the temporary file

  // Configuration method to set tmpPath and fileName
  static config(options = {}) {
    this.tmpPath = options.tmpPath || this.tmpPath; // Set custom or default tmpPath
    this.fileName = options.fileName || this.fileName; // Set custom or default fileName

    if (!this.tmpPath) {
      throw new FdyTmpError("tmpPath is required"); // Throw an error if tmpPath is not provided
    }

    if (!this.fileName) {
      throw new FdyTmpError("fileName is required"); // Throw an error if fileName is not provided
    }

    return this; // Return the class for chaining
  }

  // Adds or updates JSON data
  static addJson(key, value, fresh = false) {
    const prevJson = this.getJson(); // Retrieve existing JSON data

    // If key is an object and value is a boolean, replace the entire JSON
    if (typeof key === "object" && typeof value === "boolean") {
      this.isJson = true;
      this.json = key;
      return this;
    }

    // If key is an object, merge it with the existing JSON
    if (typeof key === "object") {
      this.isJson = true;
      this.json = prevJson ? { ...prevJson, ...key } : key;
      return this;
    }

    // If fresh is true, overwrite the existing JSON with a new object
    if (fresh) {
      this.isJson = true;
      this.json = {};
      this.json[key] = value;
      return this;
    }

    // If there is no previous JSON, create a new object
    if (prevJson === null) {
      this.isJson = true;
      this.json = {};
      this.json[key] = value;
      return this;
    }

    // Otherwise, update the existing JSON
    this.isJson = true;
    prevJson[key] = value;
    this.json = prevJson;

    return this; // Return the class for chaining
  }

  // Adds or updates text content
  static addContent(content, fresh = false, newLine = true) {
    const prevContent = this.getText(); // Retrieve existing content

    // If fresh is true, overwrite the existing content
    if (fresh) {
      this.isJson = false;
      this.content = "";
      this.content = content;
      return this;
    }

    // If no previous content exists, set the content
    if (prevContent === null) {
      this.isJson = false;
      this.content = content;
      return this;
    }

    // Otherwise, append new content to the existing content
    this.isJson = false;
    this.content = newLine
      ? `${prevContent}\n${content}` // Add new line between old and new content
      : `${prevContent}${content}`; // Concatenate without new line

    return this; // Return the class for chaining
  }

  // Retrieves JSON data from the file
  static getJson(key = null) {
    try {
      // Ensure fileName and tmpPath are set
      if (!this.fileName || !this.tmpPath) {
        throw new FdyTmpError("fileName and tmpPath are required");
      }

      const filePath = path.join(this.tmpPath, this.fileName); // Construct the file path

      // If file does not exist, return null
      if (!fs.existsSync(filePath)) {
        return null;
      }

      // Read the file content and parse it as JSON
      const data = fs.readFileSync(filePath, "utf8");
      this.json = JSON.parse(data);

      // If no specific key is requested, return the entire JSON
      if (key === null) {
        return this.json;
      }

      // Return the specific key's value if it exists
      if (!this.json[key]) {
        return null;
      }

      return this.json[key];
    } catch (error) {
      throw new FdyTmpError("Error reading json: " + error); // Handle any errors during reading
    }
  }

  // Retrieves text content from the file
  static getText() {
    // Ensure fileName and tmpPath are set
    if (!this.fileName || !this.tmpPath) {
      throw new FdyTmpError("fileName and tmpPath are required");
    }

    const filePath = path.join(this.tmpPath, this.fileName); // Construct the file path

    // If file does not exist, return null
    if (!fs.existsSync(filePath)) {
      return null;
    }

    // Read the file content as text and return it
    const data = fs.readFileSync(filePath, "utf8");
    this.content = data;
    return this.content?.trim(); // Trim whitespace and return
  }

  // Saves either JSON or text content to the file
  static save() {
    try {
      const filePath = path.join(this.tmpPath); // Construct the directory path

      // Create the directory if it doesn't exist
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath);
      }

      // Save the content as JSON if isJson flag is set, otherwise save as text
      if (this.isJson) {
        fs.writeFileSync(
          `${filePath}/${this.fileName}`,
          JSON.stringify(this.json) // Pretty print JSON with 2-space indentation
        );
      } else {
        fs.writeFileSync(`${filePath}/${this.fileName}`, this.content); // Save plain text
      }

      return true; // Return true if save is successful
    } catch (error) {
      throw new FdyTmpError("Error saving json: " + error); // Handle any errors during saving
    }
  }

  // Deletes the temporary file
  static clear() {
    try {
      const filePath = path.join(this.tmpPath, this.fileName); // Construct the file path

      // If the file exists, delete it
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return true; // Return true if delete is successful
    } catch (error) {
      throw new FdyTmpError("Error clearing json: " + error); // Handle any errors during clearing
    }
  }

  // Deletes a specific key from the JSON data
  static deleteJsonElement(key = null) {
    try {
      const prevJson = this.getJson(); // Retrieve existing JSON data

      // If no JSON exists, return false
      if (!prevJson) {
        return false;
      }

      // Delete the specific key from the JSON
      delete prevJson[key];
      this.json = prevJson;
      this.isJson = true;
      this.save(); // Save the updated JSON

      return true; // Return true if deletion is successful
    } catch (error) {
      throw new FdyTmpError("Error deleting json element: " + error); // Handle any errors during deletion
    }
  }

  // Checks if a specific key exists in the JSON data
  static hasJsonElement(key = null) {
    try {
      const prevJson = this.getJson(); // Retrieve existing JSON data

      // If no JSON exists, return false
      if (!prevJson) {
        return false;
      }

      // Return true if the key exists, otherwise false
      return !!prevJson[key];
    } catch (error) {
      throw new FdyTmpError("Error checking json element: " + error); // Handle any errors during checking
    }
  }
}

// Export the FdyTmp class for external use
module.exports = FdyTmp;

// Export the FdyTmpError class for external use
module.exports.FdyTmpError = FdyTmpError;
