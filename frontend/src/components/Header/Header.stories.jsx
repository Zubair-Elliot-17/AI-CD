import Header from "./Header";

export default {
  title: "Components/Header",
  component: Header,
  tags: ['autodocs'], // Auto generate documentation
};

// Basic header example
export const Default = {
  args: {
    onLogoClick: () => console.log("Logo clicked!"), // Just log instead of annoying alert
  },
};