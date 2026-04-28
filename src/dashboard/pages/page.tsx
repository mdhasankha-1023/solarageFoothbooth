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
  Divider,
  Search,
  Layout,
  Cell
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
  const [filteredData, setFilteredData] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryResult = await items.query("Proposals").find();
      
      const formattedData = queryResult.items.map((item: any) => {
        const rawPrice = item.totalQuote || item.price || 0;
        const formattedPrice = new Intl.NumberFormat('en-CA', {
          style: 'currency', currency: 'CAD'
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
      setFilteredData(formattedData);
    } catch (error) {
      console.error("Data Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const filtered = proposals.filter(p => 
      p.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchTerm, proposals]);

  // UPDATED: Logic for Green/Success status
  const renderStatus = (status: any) => {
    const s = String(status || "").toLowerCase().trim();
    let skin: any = "neutral";
    
    // Green triggers
    const successTriggers = ["send", "sent", "created", "paid", "yes", "active", "success", "accepted"];
    // Orange triggers
    const warningTriggers = ["pending", "draft", "waiting"];

    if (successTriggers.includes(s)) skin = "success";
    else if (warningTriggers.includes(s)) skin = "warning";

    return (
      <Badge skin={skin} variant="solid" size="medium">
        {s.toUpperCase() || "N/A"}
      </Badge>
    );
  };

  const columns = [
    {
      title: "Proposal / Client",
      width: "30%",
      render: (row: Proposal) => (
        <Box direction="vertical">
          <Text weight="bold" size="medium">{row.title}</Text>
          <Text size="tiny" secondary>{row.customer}</Text>
        </Box>
      ),
    },
    {
      title: "Total Amount",
      render: (row: Proposal) => <Text weight="medium">{row.price}</Text>,
    },
    { title: "Quote", render: (row: Proposal) => renderStatus(row.priceQuote) },
    { title: "Proposal", render: (row: Proposal) => renderStatus(row.proposalStatus) },
    { title: "Invoice", render: (row: Proposal) => renderStatus(row.invoiced) },
    {
      title: "",
      align: "right" as const,
      render: (row: Proposal) => (
        <Button 
          size="tiny" 
          priority="secondary" 
          onClick={(e) => {
            e.stopPropagation();
            window.open(row.previewUrl, "_blank");
          }}
        >
          View Doc
        </Button>
      ),
    },
  ];

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page backgroundColor="#F6F7F9">
        <Page.Header 
          title="Proposals Dashboard" 
          subtitle="Manage client agreements and invoicing status."
          actionsBar={
            <Box gap="small">
                <Button onClick={() => fetchData()} priority="secondary" size="small">Refresh</Button>
                <Button priority="primary" size="small">Create New</Button>
            </Box>
          }
        />
        <Page.Content>
          <Box direction="vertical" gap="medium">
            
            <Layout>
                <Cell span={4}>
                    <Card>
                        <Box padding="24px" direction="vertical">
                            <Text size="tiny" weight="bold" secondary uppercase>Total Proposals</Text>
                            <Text size="large" weight="bold">{proposals.length}</Text>
                        </Box>
                    </Card>
                </Cell>
                <Cell span={4}>
                    <Card>
                        <Box padding="24px" direction="vertical">
                            <Text size="tiny" weight="bold" secondary uppercase>Active Quotes</Text>
                            <Text size="large" weight="bold" color="orange">
                                {proposals.filter(p => p.priceQuote.toLowerCase() === 'pending').length}
                            </Text>
                        </Box>
                    </Card>
                </Cell>
                <Cell span={4}>
                    <Card>
                        <Box padding="24px" direction="vertical">
                            <Text size="tiny" weight="bold" secondary uppercase>Total Paid</Text>
                            <Text size="large" weight="bold" color="green">
                                {proposals.filter(p => p.invoiced.toLowerCase() === 'paid').length}
                            </Text>
                        </Box>
                    </Card>
                </Cell>
            </Layout>

            <Card>
              <Box padding="16px 24px" align="space-between" verticalAlign="middle">
                <Box gap="small" verticalAlign="middle">
                    <Text weight="bold">All Submissions</Text>
                    <Badge size="small" skin="neutral">{filteredData.length}</Badge>
                </Box>
                <Box width="300px">
                    <Search 
                        size="small" 
                        placeholder="Search client or title..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onClear={() => setSearchTerm("")}
                    />
                </Box>
              </Box>
              <Divider />

              {loading ? (
                <Box padding="100px" align="center"><Loader size="large" /></Box>
              ) : (
                <Table
                  data={filteredData}
                  columns={columns}
                  showSelection
                  onRowClick={(row) => {
                    dashboard.openModal({
                      modalId: "83572d07-0e8a-42ec-b3e7-9868b0c539b3",
                      params: { proposalId: row.id },
                    });
                  }}
                >
                  <Table.Content />
                  {filteredData.length === 0 && (
                      <Box padding="40px" align="center">
                          <Text secondary>No proposals match your search.</Text>
                      </Box>
                  )}
                </Table>
              )}
            </Card>
          </Box>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default Index;