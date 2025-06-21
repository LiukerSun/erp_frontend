import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      links={[
        {
          key: 'ERP',
          title: 'ERP',
          href: 'https://erp.liukersun.com',
          blankTarget: true,
        },
        {
          key: 'copyright',
          title: 'Copyright © 2025 liukersun.com',
          href: 'https://blog.liukersun.com',
          blankTarget: true,
        },
      ]}
    />
  );
};

export default Footer;
