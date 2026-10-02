interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
  }
  
  export function PageContainer({
    children,
    className,
  }: PageContainerProps) {
    return (
      <div
        className={`flex flex-1 flex-col gap-6 p-6 ${className ?? ""}`}
      >
        {children}
      </div>
    );
  }