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
  Cell,
  Tabs,
  IconButton,
} from "@wix/design-system";
import { Archive, Revert, Delete, Hint } from "@wix/wix-ui-icons-common";
import "@wix/design-system/styles.global.css";

interface Proposal {
  id: string;
  quoteId: string;
  title: string;
  customer: string;
  price: string;
  priceQuote: string;
  proposalStatus: string;
  invoiced: string;
  previewUrl: string;
  archived: boolean;
}

const Index: FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredData, setFilteredData] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryResult = await items.query("Proposals").find();

      const formattedData = queryResult.items.map((item: any) => {
        const rawPrice = item.totalQuote || item.price || 0;
        const formattedPrice = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "CAD",
        }).format(rawPrice);

        return {
          id: item._id,
          title: item.package || "Untitled Proposal",
          customer: item.customer || "Unknown Customer",
          price: formattedPrice,
          priceQuote: item.priceQuote || "N/A",
          proposalStatus: item.proposal || "N/A",
          invoiced: item.invoiced || "N/A",
          previewUrl: item["link-proposals-title_fld"] || "#",
          quoteId: item.quoteId,
          archived: !!item.archived,
        };
      });

      setProposals(formattedData);
    } catch (error) {
      console.error("Data Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleArchive = async (id: string, currentStatus: boolean) => {
    try {
      const originalItem = await items.get("Proposals", id);
      const updatedItem = { ...originalItem, archived: !currentStatus };
      await items.update("Proposals", updatedItem);
      dashboard.showToast({
        message: currentStatus ? "Proposal Restored" : "Proposal Archived",
        type: "success",
      });
      fetchData();
    } catch (err) {
      console.error("Archive Error:", err);
    }
  };

  const deleteProposal = async (id: string) => {
    try {
      await items.remove("Proposals", id);
      dashboard.showToast({
        message: "Proposal deleted successfully",
        type: "success",
      });
      fetchData();
    } catch (err) {
      console.error("Delete Error:", err);
      dashboard.showToast({ message: "Delete failed", type: "error" });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const isArchivedView = activeTab === 2;
    const filtered = proposals.filter((p) => {
      const matchesSearch =
        p.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = p.archived === isArchivedView;
      return matchesSearch && matchesTab;
    });
    setFilteredData(filtered);
  }, [searchTerm, proposals, activeTab]);

  const renderStatus = (status: any) => {
    const s = String(status || "")
      .toLowerCase()
      .trim();
    let skin: any = "neutral";
    const successTriggers = [
      "send",
      "sent",
      "created",
      "paid",
      "yes",
      "active",
      "success",
      "accepted",
    ];
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
      width: "25%",
      render: (row: Proposal) => (
        <Box direction="vertical">
          <Text weight="bold" size="medium">
            {row.title}
          </Text>
          <Text size="tiny" secondary>
            {row.customer}
          </Text>
        </Box>
      ),
    },
    {
      title: "Total Amount",
      render: (row: Proposal) => <Text weight="medium">{row.price}</Text>,
    },
    { title: "Quote", render: (row: Proposal) => renderStatus(row.priceQuote) },
    {
      title: "Proposal",
      render: (row: Proposal) => renderStatus(row.proposalStatus),
    },
    { title: "Invoice", render: (row: Proposal) => renderStatus(row.invoiced) },
    {
      title: "Manage",
      render: (row: Proposal) => (
        <Box gap="small" verticalAlign="middle">
          <Button
            size="tiny"
            priority="secondary"
            skin={row.archived ? "standard" : "destructive"}
            prefixIcon={row.archived ? <Revert /> : <Archive />}
            onClick={(e) => {
              e.stopPropagation();
              toggleArchive(row.id, row.archived);
            }}
          >
            {row.archived ? "Restore" : "Archive"}
          </Button>

          <IconButton
            size="tiny"
            priority="secondary"
            skin="destructive"
            onClick={(e) => {
              e.stopPropagation();
              deleteProposal(row.id);
            }}
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
    {
      title: "",
      align: "right" as const,
      render: (row: Proposal) => (
        <Button
          size="tiny"
          priority="secondary"
          onClick={(e) => {
            e.stopPropagation();
            dashboard.openModal({
              modalId: "6d7fb602-779a-4570-a2cf-02204c1c90bb",
              params: { proposalId: row.quoteId },
            });
          }}
        >
          Preview
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
              <Button
                onClick={() => fetchData()}
                priority="secondary"
                size="small"
              >
                Refresh
              </Button>
              <Button priority="primary" size="small">
                Create New
              </Button>
            </Box>
          }
        />
        <Page.Content>
          <Box direction="vertical" gap="medium">
            <Layout>
              <Cell span={6}>
                <Card>
                  <Box padding="24px" direction="vertical">
                    <Text size="tiny" weight="bold" secondary uppercase>
                      Total Proposals
                    </Text>
                    <Text size="large" weight="bold">
                      {proposals.filter((p) => !p.archived).length}
                    </Text>
                  </Box>
                </Card>
              </Cell>
              <Cell span={6}>
                <Card>
                  <Box padding="24px" direction="vertical">
                    <Text size="tiny" weight="bold" secondary uppercase>
                      Total Archived
                    </Text>
                    <Text size="large" weight="bold" color="grey">
                      {proposals.filter((p) => p.archived).length}
                    </Text>
                  </Box>
                </Card>
              </Cell>
            </Layout>

            <Tabs
              activeId={activeTab}
              onClick={(tab) => setActiveTab(tab.id as number)}
              items={[
                { id: 1, title: "Active Proposals" },
                { id: 2, title: "Archive" },
              ]}
            />

            <Card>
              <Box
                padding="16px 24px"
                align="space-between"
                verticalAlign="middle"
              >
                <Box gap="small" verticalAlign="middle">
                  <Text weight="bold">
                    {activeTab === 1
                      ? "All Submissions"
                      : "Archived Submissions"}
                  </Text>
                  <Badge size="small" skin="neutral">
                    {filteredData.length}
                  </Badge>
                </Box>
                <Box width="300px">
                  <Search
                    size="small"
                    placeholder="Search client or title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClear={() => setSearchTerm("")}
                  />
                </Box>
              </Box>
              <Divider />

              {loading ? (
                <Box padding="100px" align="center">
                  <Loader size="large" />
                </Box>
              ) : (
                <Table
                  data={filteredData}
                  columns={columns}
                  onRowClick={(row) => {
                    dashboard.openModal({
                      modalId: "83572d07-0e8a-42ec-b3e7-9868b0c539b3",
                      params: { proposalId: row.id },
                    });
                  }}
                >
                  <Table.Content />
                  {/* Empty State UI */}
                  {filteredData.length === 0 && (
                    <Table.EmptyState
                      title="No results found"
                      subtitle={searchTerm ? `No matches for "${searchTerm}"` : "Your list is currently empty."}
                      image={<Box padding="20px"><Hint size="100px" /></Box>}
                    />
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