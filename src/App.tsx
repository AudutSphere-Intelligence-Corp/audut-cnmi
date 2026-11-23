import { useMemo, useState, useEffect, useCallback } from "react"

type CardItem = {
  id: string
  category: string
  title: string
  subtitle: string
  details: string
  status: string
  tags: string[]
  owner?: string
  timestamp: string
}

const cnmiIslands = ["Saipan", "Tinian", "Rota", "Aguiguan", "Alamagan", "Pagan", "Anatahan", "Farallon de Medinilla", "Managaha"]

// Built-in emergency update, recovered verbatim from the live site (July 1,
// 2026). It always shows, even if the database is unreachable. The same
// card is also stored as a row in Neon (id EMERGENCY-TD09W-2026-07-01-2100CHST);
// dedupeCards below keeps it from ever appearing twice.
const initialCardItems: CardItem[] = [
  {
    id: "EMERGENCY-TD09W-2026-07-01-2100CHST",
    category: "Emergency Alert",
    title: "Wednesday Update - Tropical Depression 09W",
    subtitle: "09W Making its Way Toward the Marianas",
    details: [
      "9 pm ChST - Wednesday, July 1, 2026",
      "Invest 95W was upgraded to Tropical Depression 09W early this afternoon. 09W is now the 9th tropical cyclone in the western North Pacific in 2026. It receives a name once the Japan Meteorological Agency's Tokyo Typhoon Center analyzes the system as a tropical storm (the next category of intensity).",
      "At 7 pm ChST in the Joint Typhoon Warning Center's Bulletin #2, TD 09W had strengthened, with maximum sustained winds now at 35 mph (39 mph is a tropical storm). It is likely to become a tropical storm overnight or early Thursday, as it is expected to strengthen in the coming days.",
      "It was centered near 9.5N 162.6E, or about 1235 miles east-southeast of Guam. It was moving northwest at 8 mph. 09W is expected to continue generally toward the west-northwest the next several days.",
      "09W remains a serious threat to all of the Mariana Islands, with a possible passage still anticipated for the Marianas, somewhere between Guam and Pagan. Three to 4 days remain for changes and shifts to occur within forecasts and tracks, but trends have maintained a forecast passage through the Marianas late on Sunday into Monday.",
      "Take time now to prepare.",
      "This is a serious threat to the region, with the potential for a strong typhoon to pass near, or over, any one of the islands of Guam or the CNMI.",
      "Tents, canopies, tarps, political campaign signs and other loose and wind-vulnerable items should be secured or dismantled in advance of an approaching tropical cyclone.",
      "Stay up to date with the latest forecasts from NWS Guam in the coming days as forecasts evolve. Also, listen for, and heed information from the CNMI Homeland Security & Emergency Management; and the Guam Offices of Homeland Security and Civil Defense.",
      "weather.gov/gum",
    ].join("\n\n"),
    status: "RED",
    tags: ["emergency", "red", "tropical-depression", "09w", "marianas"],
    owner: "Audut Base emergency update",
    timestamp: "9 pm ChST - Wednesday, July 1, 2026",
  },
]

const categories = ["All", "Emergency Alert", "Supply Vendor", "Agency Update", "Outage Report", "Donation Tracking", "Debris Cleanup", "Zoning Notice"]

function dedupeCards(...lists: CardItem[][]): CardItem[] {
  const seen = new Set<string>()
  return lists.flat().filter((card) => {
    if (seen.has(card.id)) return false
    seen.add(card.id)
    return true
  })
}

type ReportRow = {
  id: string
  category: string
  title: string
  subtitle: string
  details: string
  status: string
  tags: string[] | null
  owner?: string | null
  timestamp: string
}

function rowToCard(row: ReportRow): CardItem {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    subtitle: row.subtitle,
    details: row.details,
    status: row.status,
    tags: row.tags || [],
    owner: row.owner || undefined,
    timestamp: row.timestamp,
  }
}

function App() {
  const [cards, setCards] = useState<CardItem[]>(initialCardItems)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showDetails, setShowDetails] = useState(false)
  const [actionLog, setActionLog] = useState<string[]>([])
  const [newReporter, setNewReporter] = useState("")
  const [newCategory, setNewCategory] = useState("Outage Report")
  const [newIsland, setNewIsland] = useState("Saipan")
  const [newTitle, setNewTitle] = useState("")
  const [newSubtitle, setNewSubtitle] = useState("")
  const [newDetails, setNewDetails] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dbStatus, setDbStatus] = useState<"unconfigured" | "loading" | "connected" | "error">("unconfigured")

  const loadReports = useCallback(async (markRefreshing = false) => {
    if (markRefreshing) setIsRefreshing(true)
    setDbStatus("loading")
    try {
      const res = await fetch("/api/reports")
      if (!res.ok) {
        console.error("Reports error:", res.status)
        setDbStatus("error")
        return
      }
      const json = await res.json()
      const rows = (json.reports || []) as ReportRow[]
      if (rows.length > 0) {
        setCards(dedupeCards(initialCardItems, rows.map(rowToCard)))
      }
      setDbStatus("connected")
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Failed to load reports:", err)
      setDbStatus("error")
    } finally {
      if (markRefreshing) setIsRefreshing(false)
    }
  }, [])

  // Load once, then poll every 30 seconds so new reports from other
  // visitors appear without a reload (replaces the old Supabase Realtime
  // subscription, which Neon does not provide).
  useEffect(() => {
    void loadReports()
    const timer = window.setInterval(() => {
      void loadReports()
    }, 30000)
    return () => {
      window.clearInterval(timer)
    }
  }, [loadReports])

  const filteredCards = useMemo(
    () => cards.filter((card) => selectedCategory === "All" || card.category === selectedCategory),
    [cards, selectedCategory]
  )

  const activeCard = useMemo(() => filteredCards[currentIndex], [filteredCards, currentIndex])
  const nextCard = useMemo(() => filteredCards[currentIndex + 1], [filteredCards, currentIndex])

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setCurrentIndex(0)
    setShowDetails(false)
  }

  const handleSubmitReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!cnmiIslands.includes(newIsland)) {
      setError("Please select a valid CNMI island for the report.")
      return
    }

    if (!newTitle || !newSubtitle || !newDetails || !newReporter) {
      setError("Please complete all required fields before submitting.")
      return
    }

    setIsLoading(true)
    setError("")

    const newCard: CardItem = {
      id: `USER-${Date.now()}`,
      category: newCategory,
      title: newTitle,
      subtitle: `${newSubtitle} — ${newIsland}`,
      details: `${newDetails} Reported by ${newReporter} in ${newIsland}.`,
      status: "User report",
      tags: [newCategory.toLowerCase().replace(/\s+/g, "-"), newIsland.toLowerCase()],
      owner: newReporter,
      timestamp: `Submitted ${new Date().toLocaleString()}`,
    }

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newCard.id,
          category: newCard.category,
          title: newCard.title,
          subtitle: newCard.subtitle,
          details: newCard.details,
          status: newCard.status,
          tags: newCard.tags,
          owner: newCard.owner,
          timestamp: newCard.timestamp,
        }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(`Failed to save report: ${data.error || res.statusText}`)
        setIsLoading(false)
        return
      }

      // Re-fetch right away so the new report appears without waiting
      // for the next 30-second poll.
      await loadReports()

      setNewTitle("")
      setNewSubtitle("")
      setNewDetails("")
      setNewReporter("")
      setNewCategory("Outage Report")
      setNewIsland("Saipan")
      setSelectedCategory("All")
      setCurrentIndex(0)
    } catch (err) {
      setError("Failed to submit report. Please try again.")
      console.error("Submit error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = (action: string) => {
    if (!activeCard) {
      return
    }

    const logEntry = `${activeCard.id}: ${action} • ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    setActionLog([logEntry, ...actionLog])
    setShowDetails(false)

    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="brand-lockup" aria-label="Audut">
          <img src="/audut-logo.svg" alt="Audut logo" />
        </div>
        <div>
          <p className="eyebrow">Audut Base</p>
          <h1>Disaster preparedness and recovery updates</h1>
          <p className="intro">
            Audut Base is an open-source civic-data platform for community-submitted disaster reports across the Northern Mariana Islands. Residents, volunteers, and responders can publish time-stamped updates on outages, resources, and recovery progress to improve transparency and coordination.
          </p>
          {dbStatus === "connected" && <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>✓ Connected to database</p>}
          {dbStatus === "loading" && <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>Loading reports...</p>}
          {dbStatus === "error" && <p style={{ fontSize: "0.9rem", color: "#d9534f", marginTop: "0.5rem" }}>⚠ Database connection error</p>}
        </div>
      </section>

      <section className="report-panel panel">
        <h2>Submit CNMI report</h2>
        <p className="report-note">Your report will be saved and appear in the deck for all users.</p>
        <form className="report-form" onSubmit={handleSubmitReport}>
          <label>
            Your name
            <input
              value={newReporter}
              onChange={(event) => setNewReporter(event.target.value)}
              placeholder="Reporter name or organization"
              disabled={isLoading}
            />
          </label>

          <label>
            Category
            <select value={newCategory} onChange={(event) => setNewCategory(event.target.value)} disabled={isLoading}>
              <option>Outage Report</option>
              <option>Supply Vendor</option>
              <option>Agency Update</option>
              <option>Donation Tracking</option>
              <option>Debris Cleanup</option>
              <option>Zoning Notice</option>
            </select>
          </label>

          <label>
            Island
            <select value={newIsland} onChange={(event) => setNewIsland(event.target.value)} disabled={isLoading}>
              {cnmiIslands.map((island) => (
                <option key={island}>{island}</option>
              ))}
            </select>
          </label>

          <label>
            Title
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Short report title"
              disabled={isLoading}
            />
          </label>

          <label>
            Location or issue
            <input
              value={newSubtitle}
              onChange={(event) => setNewSubtitle(event.target.value)}
              placeholder="Intersection, vendor, or facility"
              disabled={isLoading}
            />
          </label>

          <label>
            Details
            <textarea
              value={newDetails}
              onChange={(event) => setNewDetails(event.target.value)}
              placeholder="What happened, when, and who is involved"
              rows={4}
              disabled={isLoading}
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="button-primary" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit report"}
          </button>
        </form>
      </section>

      <section className="category-nav">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-tab ${selectedCategory === category ? "active" : ""}`}
            type="button"
            onClick={() => handleCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </section>

      <section className="deck-section">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <button
            type="button"
            className="button-secondary"
            onClick={() => {
              void loadReports(true)
            }}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "↻ Refresh reports"}
          </button>
          {lastUpdated && (
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <div className="card-stack">
          {nextCard && (
            <article className="card card-back">
              <span className="card-category">Next</span>
              <h2>{nextCard.title}</h2>
              <p className="card-subtitle">{nextCard.subtitle}</p>
            </article>
          )}

          {activeCard ? (
            <article className={`card card-front ${activeCard.status.toLowerCase() === "red" ? "card-alert-red" : ""}`}>
              <div className="card-header">
                <span className="card-category">{activeCard.category}</span>
                <span className={`status-pill status-${activeCard.status.toLowerCase().replace(/\s+/g, "-")}`}>
                  {activeCard.status}
                </span>
              </div>

              <h2>{activeCard.title}</h2>
              <p className="card-subtitle">{activeCard.subtitle}</p>

              <div className="tag-row">
                {activeCard.tags.map((tag) => (
                  <span key={`${activeCard.id}-${tag}`} className="tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="meta-row">
                {activeCard.owner && <span>{activeCard.owner}</span>}
                <span>{activeCard.timestamp}</span>
              </div>

              {showDetails && <p className="card-details">{activeCard.details}</p>}

              <div className="button-row">
                <button type="button" className="button-secondary" onClick={() => setShowDetails((current) => !current)}>
                  {showDetails ? "Hide Info" : "More Info"}
                </button>
                <button type="button" className="button-primary" onClick={() => handleAction("Need this")}>
                  Need this
                </button>
              </div>

              <button type="button" className="button-skip" onClick={() => handleAction("Skip")}>
                Skip
              </button>
            </article>
          ) : (
            <article className="card card-front empty-state-card">
              <h2>No cards in this category</h2>
              <p>Switch categories or submit a new report from a CNMI island.</p>
            </article>
          )}
        </div>
      </section>

      <section className="log-section">
        <div className="panel">
          <h2>Action history</h2>
          {actionLog.length === 0 ? (
            <p>No actions taken yet. Tap "Need this" or "Skip" to move through the cards.</p>
          ) : (
            <ul className="log-list">
              {actionLog.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
