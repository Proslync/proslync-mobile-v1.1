import * as mockRegistry from "../mock-registry";

export interface SchoolItem {
  id: string;
  name: string;
  handle: string;
  conference: string;
  initials: string;
  color: string;
  /** e.g. "327 athletes" */
  athletes: string;
}

export const SCHOOL_CATALOG: SchoolItem[] = [
  { id: "sc-duke",     name: "Duke University",              handle: "@dukembb",       conference: "ACC",      initials: "D",  color: "#001A57", athletes: "418 athletes" },
  { id: "sc-syracuse", name: "Syracuse University",          handle: "@cuse_mbb",      conference: "ACC",      initials: "S",  color: "#F76900", athletes: "372 athletes" },
  { id: "sc-unc",      name: "University of North Carolina", handle: "@uncbasketball", conference: "ACC",      initials: "NC", color: "#7BAFD4", athletes: "402 athletes" },
  { id: "sc-kentucky", name: "University of Kentucky",       handle: "@kentuckymbb",   conference: "SEC",      initials: "UK", color: "#0033A0", athletes: "388 athletes" },
  { id: "sc-uconn",    name: "UConn",                        handle: "@uconnmbb",      conference: "Big East", initials: "UC", color: "#000E2F", athletes: "294 athletes" },
  { id: "sc-ucla",     name: "UCLA",                         handle: "@uclambb",       conference: "Big Ten",  initials: "LA", color: "#2D68C4", athletes: "364 athletes" },
  { id: "sc-byu",      name: "BYU",                          handle: "@byubasketball", conference: "Big 12",   initials: "BY", color: "#002E5D", athletes: "256 athletes" },
  { id: "sc-michigan", name: "University of Michigan",       handle: "@umichbball",    conference: "Big Ten",  initials: "M",  color: "#00274C", athletes: "442 athletes" },
];

mockRegistry.register({
  id: "school-catalog",
  description: "School directory used by the search screen",
  load: () => SCHOOL_CATALOG,
});
