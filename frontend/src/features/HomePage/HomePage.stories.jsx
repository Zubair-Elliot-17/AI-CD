import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './HomePage';

export default {
  title: 'Pages/HomePage',
  component: HomePage,
  // Wrap with Router so navigation works in Storybook
  decorators: [
    function(Story) {
      return (
        <BrowserRouter>
          <Story />
        </BrowserRouter>
      );
    },
  ],
};

// Basic homepage story
export const Default = {
  // No special parameters needed
};