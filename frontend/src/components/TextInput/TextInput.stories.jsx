import TextInput from "./TextInput";

export default {
  title: "Components/TextInput",
  component: TextInput,
  tags: ['autodocs'], // Auto generate documentation
};

// Basic default text input
export const Default = {
  args: {
    onSubmit: function(text, file) { 
      alert("Submitted:", text, file); 
    },
    onFileAttach: function(file) { 
      alert("File attached:", file.name); 
    },
  },
};
