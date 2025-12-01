import React from 'react';
import HistoryPage from './HistoryPage';
import { BrowserRouter } from 'react-router-dom';

export default {
  title: 'Pages/HistoryPage',
  component: HistoryPage,
  // Wrap with router for navigation to work
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

// Basic empty history page
export const Default = {
  args: {},
};
