import Metric from "./Metric";

// Storybook configuration for Metric component
export default {
  title: "Components/Metric",
  component: Metric,
  argTypes: {
    percentage: { control: { type: "range", min: 0, max: 100 } }, // Slider control for percentage
  },
  tags: ['autodocs'], // Auto generate documentation
};

// Default story with 65% progress example
export const Default = {
  args:{
    percentage:65,
  },
};

export const Ten = {
  args:{
    percentage:10,
  },
};

export const Ninety = {
  args:{
    percentage:90,
  },
};