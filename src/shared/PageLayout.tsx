import React from 'react';
import './layout.css';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, className = '' }) => (
  <div className={`page-layout ${className}`.trim()}>{children}</div>
);

export default PageLayout;