import React from 'react';
import Icon from './Icon';
// Import some icons to use in stories
import { MdAttachFile, MdArrowUpward, MdFavorite } from 'react-icons/md';

export default {
  title: 'Components/Icon',
  component: Icon,
  tags: ['autodocs'], // Auto generate documentation
};

// Different icon examples for testing

export const Paperclip = {
  args: {
    icon: MdAttachFile,
  },
};

export const ArrowUp = {
  args: {
    icon: MdArrowUpward,
    color: 'white',
    backgroundColor: '#8E12D5',
  },
};

export const Heart = {
  args: {
    icon: MdFavorite,
    color: '#FF3366',
  },
};

export const Disabled = {
  args: {
    icon: MdArrowUpward,
    isDisabled: true,
  },
};

export const CustomSize = {
  args: {
    icon: MdFavorite,
    size: 60,
    color: 'white',
    backgroundColor: '#8E12D5',
  },
};