import FileAttachmentIndicator from "./FileAttachmentIndicator";

export default {
  title: "Components/FileAttachmentIndicator",
  component: FileAttachmentIndicator,
  tags: ['autodocs'], // Auto generate documentation
};

// Different file examples to test the component

export const Default = {
  args: {
    file: {
      name: "example_document.pdf",
      size: 1024 * 1024, // 1MB in bytes
    },
    onRemove: () => console.log("File removed!"), // Simple log instead of alert. Go to browser console to see this
  },
};

export const LongFileName = {
  args: {
    file: {
      name: "very_long_document_name_that_should_be_truncated.docx",
      size: 2.5 * 1024 * 1024, // 2.5MB
    },
    onRemove: () => console.log("File removed!"),
  },
};

export const TextFile = {
  args: {
    file: {
      name: "notes.txt",
      size: 512, // Half a KB
    },
    onRemove: () => console.log("File removed!"),
  },
};