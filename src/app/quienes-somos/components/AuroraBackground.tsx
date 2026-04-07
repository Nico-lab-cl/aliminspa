'use client';
import React, { ReactNode } from 'react';
import styles from '../page.module.css';

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main className={styles.auroraWrapper} {...props}>
      <div className={styles.auroraBg}>
        <div className={styles.auroraGradient} />
      </div>
      <div className={styles.contentWrapper}>
        {children}
      </div>
    </main>
  );
};
