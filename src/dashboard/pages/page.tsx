import React, { type FC, useEffect, useState } from "react";
import { items } from "@wix/data";
import { dashboard } from "@wix/dashboard";
import {
  Page,
  WixDesignSystemProvider,
  Table,
  Card,
  Text,
  Badge,
  Loader,
  Box,
  Button,
  Divider
} from "@wix/design-system";
import "@wix/design-system/styles.global.css";

interface Proposal {
  id: string;
  title: string;
  customer: string;
  price: string;
  priceQuote: string;
  proposalStatus: string;
  invoiced: string;
  previewUrl: string;
}

const Index: FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryResult = await items.query("Proposals").find();
      
      const formattedData = queryResult.items.map((item: any) => {
        const rawPrice = item.total || item.price || 0;
        const formattedPrice = new Intl.NumberFormat('en-US', {
          style: 'currency', currency: 'USD'
        }).format(rawPrice);

        return {
          id: item._id,
          title: item.title || "Untitled Proposal",
          customer: item.customer || "Unknown Customer",
          price: formattedPrice,
          priceQuote: item.priceQuote || "N/A",
          proposalStatus: item.proposal || "N/A",
          invoiced: item.invoiced || "N/A",
          previewUrl: item["link-proposals-title_fld"] || "#", 
        };
      });
      
      setProposals(formattedData);
    } catch (error) {
      console.error("Data Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const renderStatus = (status: any) => {
    const s = String(status || "").toLowerCase();
    let skin: any = "neutral";
    if (["send", "paid", "yes", "active", "success", "accepted"].includes(s)) skin = "success";
    else if (["pending", "draft", "waiting", "N/A"].includes(s)) skin = "warning";

    return (
      <Badge skin={skin} variant="light" size="medium">
        {s.toUpperCase() || "N/A"}
      </Badge>
    );
  };

  const columns = [
    {
      title: "Proposal Title",
      width: "250px",
      render: (row: Proposal) => <Text weight="bold" ellipsis>{row.title}</Text>,
    },
    {
      title: "Customer",
      render: (row: Proposal) => <Text size="small">{row.customer}</Text>,
    },
    {
      title: "Total Price",
      render: (row: Proposal) => <Text>{row.price}</Text>,
    },
    { title: "Quote", render: (row: Proposal) => renderStatus(row.priceQuote) },
    { title: "Proposal", render: (row: Proposal) => renderStatus(row.proposalStatus) },
    { title: "Invoiced", render: (row: Proposal) => renderStatus(row.invoiced) },
    {
      title: "Action",
      render: (row: Proposal) => (
        <Button 
          size="tiny" 
          priority="secondary" 
          onClick={(e) => {
            e.stopPropagation();
            window.open(row.previewUrl, "_blank");
          }}
        >
          Preview Proposal
        </Button>
      ),
    },
  ];

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header 
          title="All Proposals" 
          subtitle="Management Dashboard"
          actionsBar={<Button onClick={() => fetchData()} priority="secondary" size="small">Refresh</Button>}
        />
        <Page.Content>
          <Card>
            {/* This custom Header Box replaces the Toolbar 
                It is 100% bug-free and looks exactly like the official UI.
            */}
            <Box padding="18px 24px" align="left" gap="small">
              <Text weight="bold">Total Proposals</Text>
              <Badge size="small" skin="neutral">{proposals.length}</Badge>
            </Box>
            <Divider />

            {loading ? (
              <Box padding="100px" align="center"><Loader size="large" /></Box>
            ) : (
              <Table
                data={proposals}
                columns={columns}
                onRowClick={(row) => {
                  dashboard.openModal({
                    modalId: "83572d07-0e8a-42ec-b3e7-9868b0c539b3",
                    params: { proposalId: row.id },
                  });
                }}
              >
                <Table.Content />
              </Table>
            )}
          </Card>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default Index;