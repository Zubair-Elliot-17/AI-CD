import Panel from "./Panel";

export default {
  title: "Components/Panel",
  component: Panel,
  tags: ['autodocs'], // Auto generate documentation
};

// Example panel with navigation buttons.
export const Default = {
  args: {
    buttons: ["AI Text Detector", "History"],
    onSelect: function(button) { 
      alert("Selected:", button); // alert
    },
  },
};