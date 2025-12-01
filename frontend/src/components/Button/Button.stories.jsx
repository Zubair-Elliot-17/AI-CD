import Button from './Button';

export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered', // Center the button in Storybook
  },
  tags: ['autodocs'], // Auto generate documentation
};

// Different button examples for testing

export const Primary = {
  args: {
    children: 'Click me',
    variant: 'primary',
    size: 'medium',
  },
};

export const Secondary = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Success = {
  args: {
    children: 'Success Button',
    variant: 'success',
  },
};

export const Danger = {
  args: {
    children: 'Danger Button',
    variant: 'danger',
  },
};

export const Disabled = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const Small = {
  args: {
    children: 'Small Button',
    size: 'small',
  },
};

export const Large = {
  args: {
    children: 'Large Button',
    size: 'large',
  },
};

export const Custom = {
  args: {
    children: 'Custom Button',
    borderRadius: '8px',
    color: '#ffffff',
    backgroundColor: '#ff5500',
  },
};