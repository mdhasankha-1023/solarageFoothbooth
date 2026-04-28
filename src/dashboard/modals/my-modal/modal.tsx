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
  Button,
  Input,
  IconButton
} from '@wix/design-system';
import { Check, Add, Delete, Send } from '@wix/wix-ui-icons-common';
import "@wix/design-system/styles.global.css";
import { width, height } from './modal.json';

const Modal: FC = () => {
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedProposal, setEditedProposal] = useState<any>(null);
  const [addonsArray, setAddonsArray] = useState<string[]>([]);

  const InterStack = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  const titleStyle: React.CSSProperties = {
    fontFamily: InterStack,
    letterSpacing: '1.2px',
    fontSize: '11px',
    fontWeight: 800,
    color: '#32373F',
    marginBottom: '10px',
    display: 'block',
    textTransform: 'uppercase'
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: InterStack,
    fontSize: '16px',
    fontWeight: 600,
    color: '#162D3D',
    backgroundColor: '#ffffff',
    border: '1px solid #DFE3E8',
    padding: '14px 18px',
    borderRadius: '8px',
    display: 'inline-block',
    width: '100%',
    boxSizing: 'border-box'
  };

  const blackButtonStyle: React.CSSProperties = {
    backgroundColor: '#116dff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: 700,
    fontFamily: InterStack,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  useEffect(() => {
    const observer = dashboard.observeState(async (state: any) => {
      const proposalId = state?.proposalId || state?.params?.proposalId;
      if (proposalId) {
        try {
          const data = await items.get("Proposals", proposalId);
          setProposal(data);
          setEditedProposal({ ...data, total: data.totalQuote || data.total });
          const initialAddons = data.addons ? data.addons.split(/[+\n,]+/).map((s: string) => s.trim()).filter(Boolean) : [];
          setAddonsArray(initialAddons);
        } catch (err) {
          console.error("CMS Fetch Error:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });
    return () => observer.disconnect();
  }, []);

  const handleAddAddon = () => setAddonsArray([...addonsArray, ""]);
  const handleUpdateAddon = (index: number, value: string) => {
    const updated = [...addonsArray];
    updated[index] = value;
    setAddonsArray(updated);
  };
  const handleRemoveAddon = (index: number) => setAddonsArray(addonsArray.filter((_, i) => i !== index));

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Prepare the exact data mapping based on your field list
      const finalAddonsString = addonsArray.filter(s => s.trim() !== "").join(" + ");

      const dataToSave = {
        _id: editedProposal._id, // Required for the update to work
        quoteId: editedProposal.quoteId,
        customer: editedProposal.customer,
        email: editedProposal.email,
        quantity: editedProposal.quantity,
        nextPayment: editedProposal.nextPayment,
        status: editedProposal.status,
        "link-proposals-title_fld": editedProposal["link-proposals-title_fld"],
        customerSign: editedProposal.customerSign,
        signDate: editedProposal.signDate,
        priceQuote: editedProposal.priceQuote,
        proposal: editedProposal.proposal,
        package: editedProposal.package,
        invoiced: editedProposal.invoiced,
        phone: editedProposal.phone,
        totalQuote: editedProposal.total, // Mapping 'total' from UI to 'totalQuote' field
        location: editedProposal.location,
        eventDate: editedProposal.eventDate,
        hours: editedProposal.hours,
        eventType: editedProposal.eventType,
        addons: finalAddonsString
      };

      // 2. Update the main "Proposals" collection
      await items.update("Proposals", dataToSave);

      // 3. Handle the "UpdatedProposals" collection (Upsert Logic)
      const existingResults = await items.query("UpdatedProposals")       
        .eq("quoteId", dataToSave.quoteId)
        .find();

      if (existingResults.items.length > 0) {
        // IT EXISTS: Match the existing _id to update the record properly
        const existingItem = existingResults.items[0];   
        const itemWithId = {
          ...dataToSave,
          _id: existingItem._id
        };
        await items.update("UpdatedProposals", itemWithId);
        console.log("UpdatedProposals: Record updated.");
      } else {
        // DOES NOT EXIST: Insert as new (remove _id so Wix generates a new one for this table)
        const { _id, ...insertData } = dataToSave;
        await items.insert("UpdatedProposals", insertData);
        console.log("UpdatedProposals: New record inserted.");
      }

      setProposal(dataToSave);
      setEditMode(false);
      dashboard.showToast({ message: "Changes saved correctly!", type: "success" });
    } catch (err) {
      console.error("Save Error:", err);
      dashboard.showToast({ message: "Save failed. Check console.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      dashboard.showToast({ message: "Proposal sent successfully!", type: "success" });
    }, 1500);
  };

  const formatCurrency = (val: any) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
    return isNaN(num) ? "CA$0.00" : new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(num);
  };

  const renderStatus = (status: any) => {
    const s = String(status || "N/A").toLowerCase();
    let skin: any = "neutral";
    const successTriggers = ["send", "sent", "created", "paid", "yes", "active", "success", "accepted"];
    if (successTriggers.includes(s)) skin = "success";
    return <Badge skin={skin} variant="solid" size="medium" style={{ fontFamily: InterStack, fontWeight: 700 }}>{s.toUpperCase()}</Badge>;
  };

  if (loading) return <WixDesignSystemProvider><Box height={height} width={width} align="center" verticalAlign="middle"><Loader /></Box></WixDesignSystemProvider>;

  const addOnsDisplayList = proposal.addons ? proposal.addons.split(/[+\n,]+/).filter((t: string) => t.trim() !== "") : [];

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <CustomModalLayout
        width={width}
        maxHeight={height}
        removeContentPadding
        primaryButtonText="Close Window"
        primaryButtonOnClick={() => dashboard.closeModal()}
        title={`ADMIN CONSOLE — ${proposal.quoteId || 'REF'}`}
        content={
          <Box direction="vertical" backgroundColor="#F6F8FA" minHeight="100%" style={{ fontFamily: InterStack }}>

            <Box padding="32px 48px" backgroundColor="#ffffff" borderBottom="1px solid #E1E4E8" align="space-between" verticalAlign="middle">
              <Box direction="vertical">
                <Heading appearance="H2" style={{ fontFamily: InterStack, fontWeight: 800 }}>{proposal.customer || "Client Name"}</Heading>
                <Text size="medium" secondary style={{ fontFamily: InterStack }}>{proposal.email}</Text>
              </Box>
              <Box gap="medium">
                {!editMode && (
                  <Button prefixIcon={<Send />} onClick={handleSend} disabled={sending}>
                    {sending ? "Sending..." : "Send Proposal"}
                  </Button>
                )}
                <Button priority={editMode ? "primary" : "secondary"} onClick={() => editMode ? handleSave() : setEditMode(true)} disabled={saving}>
                  {editMode ? (saving ? "Saving..." : "Save Changes") : "Edit Entry"}
                </Button>
                {editMode && <Button priority="secondary" onClick={() => { setEditMode(false); setAddonsArray(proposal.addons ? proposal.addons.split(/[+\n,]+/).map((s: string) => s.trim()).filter(Boolean) : []); }}>Cancel</Button>}
              </Box>
            </Box>

            <Box padding="40px" direction="vertical" gap="large">
              <Layout gap="40px">

                <Cell span={8}>
                  <Box direction="vertical" gap="large">
                    <Card>
                      <Box padding="32px">
                        <Layout gap="32px">
                          <Cell span={12}>
                            <span style={titleStyle}>Client Full Name</span>
                            {editMode ? <Input size="large" value={editedProposal.customer} onChange={e => setEditedProposal({ ...editedProposal, customer: e.target.value })} /> : <span style={valueStyle}>{proposal.customer || "—"}</span>}
                          </Cell>
                          <Cell span={12}>
                            <span style={titleStyle}>Email Address</span>
                            {editMode ? <Input size="large" value={editedProposal.email} onChange={e => setEditedProposal({ ...editedProposal, email: e.target.value })} /> : <span style={valueStyle}>{proposal.email || "—"}</span>}
                          </Cell>
                          <Cell span={12}>
                            <span style={titleStyle}>Service Category</span>
                            {editMode ? <Input size="large" value={editedProposal.eventType} onChange={e => setEditedProposal({ ...editedProposal, eventType: e.target.value })} /> : <span style={valueStyle}>{proposal.eventType || "—"}</span>}
                          </Cell>
                          <Cell span={6}>
                            <span style={titleStyle}>Project Date</span>
                            {editMode ? <Input size="large" value={editedProposal.eventDate} onChange={e => setEditedProposal({ ...editedProposal, eventDate: e.target.value })} /> : <span style={valueStyle}>{proposal.eventDate || "—"}</span>}
                          </Cell>
                          <Cell span={6}>
                            <span style={titleStyle}>Location</span>
                            {editMode ? <Input size="large" value={editedProposal.location} onChange={e => setEditedProposal({ ...editedProposal, location: e.target.value })} /> : <span style={valueStyle}>{proposal.location || "—"}</span>}
                          </Cell>
                        </Layout>
                      </Box>
                    </Card>

                    <Card>
                      <Box padding="32px" direction="vertical" gap="large">
                        {/* CUSTOM HEADER INSIDE CARD BODY TO ENSURE VISIBILITY */}
                        <Box align="space-between" verticalAlign="middle" width="100%">
                          <Text weight="bold" size="medium">Service Package & Add-ons</Text>
                          {editMode && (
                            <button
                              style={blackButtonStyle}
                              onClick={handleAddAddon}
                            >
                              <Add size="18px" color="#ffffff" /> <span>Add Item</span>
                            </button>
                          )}
                        </Box>

                        <Divider />

                        <Box direction="vertical" gap="12px">
                          <span style={titleStyle}>Primary Service</span>
                          {editMode ? <Input size="large" value={editedProposal.package} onChange={e => setEditedProposal({ ...editedProposal, package: e.target.value })} /> : <Heading appearance="H4" style={{ color: '#116DFF', fontWeight: 800 }}>{proposal.package || "Base Package"}</Heading>}
                        </Box>

                        <Divider />

                        <Box direction="vertical" gap="medium">
                          <span style={titleStyle}>Add-ons Inventory</span>
                          {editMode ? (
                            <Box direction="vertical" gap="medium" width="100%">
                              {addonsArray.map((addon, idx) => (
                                <Box key={idx} gap="medium" width="100%">
                                  <Box flexGrow={1} style={{ width: '100%' }}>
                                    <Input
                                      size="large"
                                      value={addon}
                                      onChange={e => handleUpdateAddon(idx, e.target.value)}
                                      placeholder="Enter addon name..."
                                    />
                                  </Box>
                                  <IconButton
                                    priority="secondary"
                                    onClick={() => handleRemoveAddon(idx)}
                                    skin="standard"
                                  >
                                    <Delete color="#EE5D52" />
                                  </IconButton>
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Box direction="vertical" gap="12px">
                              {addOnsDisplayList.length > 0 ? addOnsDisplayList.map((item: string, idx: number) => (
                                <Box key={idx} padding="16px 24px" backgroundColor="#ffffff" border="1px solid #E1E4E8" borderRadius="10px" verticalAlign="middle" gap="medium">
                                  <Check size="20px" color="#10B981" />
                                  <span style={{ fontFamily: InterStack, fontSize: '15px', color: '#162D3D', fontWeight: 700 }}>{item.trim()}</span>
                                </Box>
                              )) : <Text size="medium" secondary italic>No active add-ons.</Text>}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Card>
                  </Box>
                </Cell>

                <Cell span={4}>
                  <Box direction="vertical" gap="large">
                    <Card>
                      <Box padding="32px" direction="vertical" gap="large">
                        <Box direction="vertical">
                          <span style={titleStyle}>Contract Total</span>
                          {editMode ? <Input size="large" value={editedProposal.total} onChange={e => setEditedProposal({ ...editedProposal, total: e.target.value })} /> : <Heading appearance="H1" style={{ fontWeight: 900, color: '#162D3D', fontSize: '32px' }}>{formatCurrency(proposal.totalQuote || proposal.total)}</Heading>}
                        </Box>
                        <Divider />
                        <Box direction="vertical" gap="medium">
                          <Box align="space-between"><span style={titleStyle}>Quote</span>{renderStatus(proposal.priceQuote)}</Box>
                          <Box align="space-between"><span style={titleStyle}>Proposal</span>{renderStatus(proposal.proposal)}</Box>
                          <Box align="space-between"><span style={titleStyle}>Invoice</span>{renderStatus(proposal.invoiced)}</Box>
                        </Box>
                      </Box>
                    </Card>

                    <Card>
                      <Box padding="32px" align="center" direction="vertical" gap="large">
                        <Box width="100%" height="120px" backgroundColor="#F1F3F5" border="1px dashed #ADB5BD" borderRadius="14px" verticalAlign="middle" align="center">
                          {proposal.customerSign ? <img src={proposal.customerSign} style={{ maxHeight: "80px", mixBlendMode: 'multiply' }} alt="Sig" /> : <Text secondary weight="bold">No Signature</Text>}
                        </Box>
                        <Text size="medium" weight="bold">{proposal.customer || "Pending"}</Text>
                      </Box>
                    </Card>
                  </Box>
                </Cell>

              </Layout>
            </Box>
          </Box>
        }
      />
    </WixDesignSystemProvider>
  );
};

export default Modal;