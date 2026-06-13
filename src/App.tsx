import { useMemo, useState, useEffect } from "react"
import { supabase, isConfigured } from "./supabaseClient"

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

const initialCardItems: CardItem[] = [
  {
    id: "SUP-001",
    category: "Supply Vendor",
    title: "Ice & Cooler Supply",
    subtitle: "Icemart Saipan",
    details: "Open daily from 8am–6pm. Deliveries available to shelters and community centers. Call ahead to reserve ice blocks.",
    status: "Available",
    tags: ["ice", "shelter", "delivery"],
    timestamp: "Updated 2026-06-13 10:15",
  },
  {
    id: "AGEN-002",
    category: "Agency Update",
    title: "CUC Power Restoration",
    subtitle: "CUC crew is working on grid repairs in San Roque",
    details: "CUC reports most outages are due to transformer damage. Restoration is targeted for June 15, pending parts arrival.",
    status: "In Progress",
    tags: ["power", "CUC", "restoration"],
    owner: "CUC",
    timestamp: "Updated 2026-06-13 09:00",
  },
  {
    id: "OUT-003",
    category: "Outage Report",
    title: "Traffic signal outage",
    subtitle: "Route 30 and Route 1 intersection",
    details: "Stoplight is still out at the intersection. DPW crews have scheduled repairs for June 14 at 2pm.",
    status: "Scheduled",
    tags: ["stoplight", "DPW", "road"],
    owner: "DPW",
    timestamp: "Updated 2026-06-13 08:45",
  },
  {
    id: "AID-004",
    category: "Donation Tracking",
    title: "Generator donations",
    subtitle: "30 generators from mainland partners",
    details: "Shipment arrived in port and is being staged for distribution to PSS shelters and community centers with power needs.",
    status: "Staged",
    tags: ["generators", "donations", "distribution"],
    owner: "DPL",
    timestamp: "Updated 2026-06-13 11:20",
  },
  {
    id: "CLEAN-005",
    category: "Debris Cleanup",
    title: "Cleanup responsibility",
    subtitle: "DPW debris crew assigned to Garapan route",
    details: "DPW is responsible for debris removal from Route 30 to Piya Road. Estimated completion is June 14 by 5pm.",
    status: "Assigned",
    tags: ["debris", "cleanup", "DPW"],
    owner: "DPW",
    timestamp: "Updated 2026-06-13 07:50",
  },
  {
    id: "ZON-006",
    category: "Zoning Notice",
    title: "Permit review for repair work",
    subtitle: "Zoning is reviewing emergency permit requests",
    details: "Zoning on track to approve temporary repair permits for housing and commercial buildings within 24 hours.",
    status: "Review",
    tags: ["zoning", "permits", "recovery"],
    owner: "Zoning",
    timestamp: "Updated 2026-06-13 11:55",
  },
]

const categories = ["All", "Supply Vendor", "Agency Update", "Outage Report", "Donation Tracking", "Debris Cleanup", "Zoning Notice"]

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
  const [dbStatus, setDbStatus] = useState<"unconfigured" | "loading" | "connected" | "error">("unconfigured")

  useEffect(() => {
    if (!isConfigured) {
      setDbStatus("unconfigured")
      return
    }

    const loadReports = async () => {
      setDbStatus("loading")
      try {
        const { data, error: fetchError } = await supabase.from("reports").select("*").order("created_at", { ascending: false })

        if (fetchError) {
          console.error("Supabase error:", fetchError)
          setDbStatus("error")
          return
        }

        if (data && data.length > 0) {
          const loadedCards: CardItem[] = data.map((row: any) => ({
            id: row.id,
            category: row.category,
            title: row.title,
            subtitle: row.subtitle,
            details: row.details,
            status: row.status,
            tags: row.tags || [],
            owner: row.owner,
            timestamp: row.timestamp,
          }))
          setCards([...loadedCards, ...initialCardItems])
          setDbStatus("connected")
        } else {
          setDbStatus("connected")
        }
      } catch (err) {
        console.error("Failed to load reports:", err)
        setDbStatus("error")
      }
    }

    loadReports()
  }, [])

  useEffect(() => {
    if (!isConfigured) return

    const subscription = supabase
      .channel("reports")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reports" }, (payload) => {
        const newCard: CardItem = {
          id: payload.new.id,
          category: payload.new.category,
          title: payload.new.title,
          subtitle: payload.new.subtitle,
          details: payload.new.details,
          status: payload.new.status,
          tags: payload.new.tags || [],
          owner: payload.new.owner,
          timestamp: payload.new.timestamp,
        }
        setCards((prev) => [newCard, ...prev])
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
      if (isConfigured) {
        const { error: insertError } = await supabase.from("reports").insert([
          {
            id: newCard.id,
            category: newCard.category,
            title: newCard.title,
            subtitle: newCard.subtitle,
            details: newCard.details,
            status: newCard.status,
            tags: newCard.tags,
            owner: newCard.owner,
            timestamp: newCard.timestamp,
          },
        ])

        if (insertError) {
          setError(`Failed to save report: ${insertError.message}`)
          setIsLoading(false)
          return
        }
      }

      if (!isConfigured) {
        setCards([newCard, ...cards])
      }

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
        <div>
          <p className="eyebrow">CNMI Disaster Response</p>
          <h1>Browse recovery updates and resources</h1>
          <p className="intro">
            Swipe through cards to see recovery efforts, available supplies, and outage reports across the Northern Mariana Islands.
          </p>
          {dbStatus === "connected" && <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>✓ Connected to Supabase</p>}
          {dbStatus === "loading" && <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>Loading reports...</p>}
          {dbStatus === "error" && <p style={{ fontSize: "0.9rem", color: "#d9534f", marginTop: "0.5rem" }}>⚠ Database connection error</p>}
        </div>
      </section>

      <section className="report-panel panel">
        <h2>Submit CNMI report</h2>
        <p className="report-note">Your report will be saved to Supabase and appear in the deck for all users.</p>
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
        <div className="card-stack">
          {nextCard && (
            <article className="card card-back">
              <span className="card-category">Next</span>
              <h2>{nextCard.title}</h2>
              <p className="card-subtitle">{nextCard.subtitle}</p>
            </article>
          )}

          {activeCard ? (
            <article className="card card-front">
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
