import React, { type FC, useState, useEffect } from 'react';
import { dashboard } from '@wix/dashboard';
import { items } from '@wix/data';
import {
  WixDesignSystemProvider,
  Box,
  CustomModalLayout,
  Loader,
  Text,
  Heading,
  Divider,
  Layout,
  Cell,
  Badge,
  Card,
  Button
} from '@wix/design-system';
import "@wix/design-system/styles.global.css";
import { width, height } from './modal.json';

const Modal: FC = () => {
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<any>(null);

  useEffect(() => {
    const observer = dashboard.observeState(async (state: any) => {
      const proposalId = state?.proposalId || state?.params?.proposalId;

      if (proposalId) {
        try {
          const data = await items.get("Proposals", proposalId);
          setProposal(data);
        } catch (err) {
          console.error("CMS Fetch Error:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setTimeout(() => setLoading(false), 1000);
      }
    });

    return () => observer.disconnect();
  }, []);

  const formatValue = (val: any, type?: 'currency') => {
    if (val === null || val === undefined || val === "") return "—";
    if (val instanceof Date || (typeof val === 'string' && val.includes('T'))) {
      return new Date(val).toLocaleDateString();
    }
    if (type === 'currency' || typeof val === 'number') {
      const num = typeof val === 'number' ? val : parseFloat(val);
      return isNaN(num) ? val : `$${num.toLocaleString()}`;
    }
    return String(val);
  };

  const renderStatus = (status: any) => {
    const s = String(status || "").toLowerCase();
    let skin: any = "neutral";
    if (["send", "paid", "yes", "active", "success", "accepted"].includes(s)) skin = "success";
    else if (["pending", "draft", "waiting", "N/A"].includes(s)) skin = "warning";
    return <Badge skin={skin} variant="light" size="medium">{s.toUpperCase() || "N/A"}</Badge>;
  };

  if (loading) {
    return (
      <WixDesignSystemProvider>
        <Box height={height} width={width} align="center" verticalAlign="middle">
          <Loader />
        </Box>
      </WixDesignSystemProvider>
    );
  }

  // Get the preview link from your CMS field (adjust field name if necessary)
  const previewLink = proposal?.["link-proposals-title_fld"] || proposal?.previewLink;

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <CustomModalLayout
        width={width}
        maxHeight={height}
        removeContentPadding
        primaryButtonText="Close"
        primaryButtonOnClick={() => dashboard.closeModal()}
        title="Proposal Details"
        content={
          proposal ? (
            <Box direction="vertical" backgroundColor="#F0F4F7" minHeight="100%">
              {/* Header Hero */}
              <Box padding="32px" backgroundColor="#ffffff" borderBottom="1px solid #E3E9ED" direction="vertical" gap="small">
                <Box align="space-between" verticalAlign="top">
                  <Box direction="vertical" gap="4px">
                    <Text size="tiny" weight="bold" secondary color="D10">DOCUMENT OVERVIEW</Text>
                    <Heading appearance="H2">{formatValue(proposal.title || proposal.title_fld)}</Heading>
                  </Box>
                  <Box direction="vertical" align="right" gap="small">
                    {previewLink && (
                      <Button 
                        size="small" 
                        priority="secondary" 
                        onClick={() => window.open(previewLink, '_blank')}
                      >
                        Preview Proposal
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Grid Content */}
              <Box padding="24px" direction="vertical" gap="medium">
                <Layout>
                  {/* Client & Finance */}
                  <Cell span={8}>
                    <Card>
                      <Box padding="24px" direction="vertical" gap="medium">
                        <Text weight="bold">Customer Details</Text>
                        <Divider />
                        <Layout>
                          <Cell span={6}>
                            <Text size="tiny" secondary weight="bold">NAME</Text>
                            <Box marginTop="4px"><Text>{formatValue(proposal.customer)}</Text></Box>
                          </Cell>
                          <Cell span={6}>
                            <Text size="tiny" secondary weight="bold">EMAIL</Text>
                            <Box marginTop="4px"><Text>{formatValue(proposal.customerEmail)}</Text></Box>
                          </Cell>
                        </Layout>
                      </Box>
                    </Card>
                  </Cell>

                  <Cell span={4}>
                    <Card>
                      <Box padding="24px" direction="vertical" gap="medium">
                        <Text weight="bold">Finance</Text>
                        <Divider />
                        <Text size="tiny" secondary weight="bold">TOTAL VALUE</Text>
                        <Heading appearance="H3" color="D10">{formatValue(proposal.total, 'currency')}</Heading>
                      </Box>
                    </Card>
                  </Cell>

                  {/* Workflow Progress Statuses */}
                  <Cell span={12}>
                    <Card>
                      <Box padding="24px" direction="vertical" gap="medium">
                        <Text weight="bold">Workflow & Progress</Text>
                        <Divider />
                        <Layout>
                          <Cell span={4}>
                            <Box direction="vertical" gap="4px">
                              <Text size="tiny" secondary weight="bold">PRICE QUOTE</Text>
                              <Box>{renderStatus(proposal.priceQuote)}</Box>
                            </Box>
                          </Cell>
                          <Cell span={4}>
                            <Box direction="vertical" gap="4px">
                              <Text size="tiny" secondary weight="bold">PROPOSAL STATUS</Text>
                              <Box>{renderStatus(proposal.proposal)}</Box>
                            </Box>
                          </Cell>
                          <Cell span={4}>
                            <Box direction="vertical" gap="4px">
                              <Text size="tiny" secondary weight="bold">INVOICE STATUS</Text>
                              <Box>{renderStatus(proposal.invoiced)}</Box>
                            </Box>
                          </Cell>
                        </Layout>
                      </Box>
                    </Card>
                  </Cell>

                  {/* Signature Section */}
                  {proposal.customerSign && (
                    <Cell span={12}>
                      <Card>
                        <Box padding="24px" direction="vertical" gap="medium">
                          <Text weight="bold">Digital Signature</Text>
                          <Divider />
                          <Box 
                            padding="32px" 
                            border="1px dashed #D6DADF" 
                            borderRadius="12px" 
                            backgroundColor="#F9FAFB" 
                            align="center"
                          >
                            <img 
                              src={proposal.customerSign} 
                              alt="Signature" 
                              style={{ maxHeight: "120px", maxWidth: "100%", mixBlendMode: 'multiply' }} 
                            />
                          </Box>
                          <Text size="tiny" secondary align="center">
                            Signed on: {formatValue(proposal.signDate)}
                          </Text>
                        </Box>
                      </Card>
                    </Cell>
                  )}
                </Layout>
              </Box>
            </Box>
          ) : (
            <Box padding="100px" align="center"><Text>Loading proposal data...</Text></Box>
          )
        }
      />
    </WixDesignSystemProvider>
  );
};

export default Modal;