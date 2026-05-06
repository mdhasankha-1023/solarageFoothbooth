import React, { useEffect, useState, type FC } from "react";
import { dashboard } from "@wix/dashboard";
import {
  WixDesignSystemProvider,
  Text,
  Box,
  CustomModalLayout,
  Loader,
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";
import { width, height, title } from "./modal.json";

const Modal: FC = () => {
  // State to store the ID once it is received from the dashboard
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Observe the state sent from the parent page
    const observer = dashboard.observeState(async (state: any) => {
      console.log("Full State Received:", state);
      
      const id = state?.proposalId;
      
      if (id) {
        setProposalId(id);
        setIsLoading(false);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <CustomModalLayout
        width={width}
        maxHeight={height}
        primaryButtonText="Close"
        primaryButtonOnClick={() => dashboard.closeModal()}
        title={title || "Proposal Preview"}
        subtitle="Viewing dynamic proposal content"
        content={
          <Box 
            direction="vertical" 
            align="center" 
            verticalAlign="middle" 
            height="600px" // Set a fixed height for the preview area
            width="100%"
          >
            {proposalId ? (
              <iframe
                src={`https://www.solargephotobooth.com/custom-proposal?id=${proposalId}&preview=true`}
                width="100%"
                height="100%"
                style={{ 
                  border: "1px solid #DFE5EB", 
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)" 
                }}
                title="Proposal Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
                allow="storage-access"
              />
            ) : (
              <Box direction="vertical" align="center" gap="12px">
                <Loader size="medium" />
                <Text secondary>Fetching Proposal Data...</Text>
              </Box>
            )}
          </Box>
        }
      />
    </WixDesignSystemProvider>
  );
};

export default Modal;