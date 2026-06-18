import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Activity, ArrowRight, Brain, Building2, CheckCircle2, CloudRain, Database, FileBarChart, Github, Landmark, Layers, Lightbulb, LineChart, Linkedin, Satellite, ShieldCheck, Sprout, Twitter, Umbrella } from "lucide-react";
//#region src/assets/hero-satellite.jpg
var hero_satellite_default = "/assets/hero-satellite-9CkfYCjj.jpg";
//#endregion
//#region src/assets/dashboard-mock.jpg
var dashboard_mock_default = "/assets/dashboard-mock-B4x5aYfU.jpg";
//#endregion
//#region src/routes/index.tsx?tsr-split=component
function Navbar() {
	return /* @__PURE__ */ jsx("header", {
		className: "fixed top-0 inset-x-0 z-50",
		children: /* @__PURE__ */ jsx("div", {
			className: "mx-auto max-w-7xl px-6 lg:px-8",
			children: /* @__PURE__ */ jsxs("div", {
				className: "mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-background/70 px-4 py-3 shadow-soft backdrop-blur-xl",
				children: [
					/* @__PURE__ */ jsxs("a", {
						href: "#",
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx("span", {
							className: "grid h-8 w-8 place-items-center rounded-lg gradient-brand text-primary-foreground shadow-card",
							children: /* @__PURE__ */ jsx(Satellite, { className: "h-4 w-4" })
						}), /* @__PURE__ */ jsxs("span", {
							className: "text-base font-semibold tracking-tight text-foreground",
							children: ["Kilimo", /* @__PURE__ */ jsx("span", {
								className: "text-gradient-brand",
								children: "Lens"
							})]
						})]
					}),
					/* @__PURE__ */ jsx("nav", {
						className: "hidden md:flex items-center gap-8",
						children: [
							{
								label: "Features",
								href: "#features"
							},
							{
								label: "How It Works",
								href: "#how"
							},
							{
								label: "Solutions",
								href: "#solutions"
							},
							{
								label: "Pricing",
								href: "#pricing"
							}
						].map((l) => /* @__PURE__ */ jsx("a", {
							href: l.href,
							className: "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
							children: l.label
						}, l.href))
					}),
					/* @__PURE__ */ jsxs("a", {
						href: "#cta",
						className: "inline-flex items-center gap-1.5 rounded-lg gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card transition-transform hover:-translate-y-0.5 hover:shadow-elevated",
						children: ["Get started ", /* @__PURE__ */ jsx(ArrowRight, { className: "h-3.5 w-3.5" })]
					})
				]
			})
		})
	});
}
function Hero() {
	return /* @__PURE__ */ jsxs("section", {
		className: "relative isolate min-h-[92vh] overflow-hidden pt-32 pb-24",
		children: [
			/* @__PURE__ */ jsx("img", {
				src: hero_satellite_default,
				alt: "Satellite view of farmland with AI data overlay",
				width: 1920,
				height: 1280,
				className: "absolute inset-0 -z-20 h-full w-full object-cover"
			}),
			/* @__PURE__ */ jsx("div", { className: "absolute inset-0 -z-10 hero-overlay" }),
			/* @__PURE__ */ jsxs("div", {
				className: "mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:gap-8 lg:px-8",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col justify-center text-white",
					children: [
						/* @__PURE__ */ jsxs("h1", {
							className: "mt-6 text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl",
							children: [
								"Finance ",
								/* @__PURE__ */ jsx("span", {
									className: "text-gradient-brand",
									children: "Resilience"
								}),
								", Not Just Credit Scores"
							]
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-6 max-w-xl text-lg text-white/75 leading-relaxed",
							children: "KilimoLens helps lenders make smarter agricultural financing decisions using climate risk, farmer resilience, and AI-driven insights, built for African markets."
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-10 flex flex-wrap items-center gap-4",
							children: /* @__PURE__ */ jsxs("a", {
								href: "#cta",
								className: "group inline-flex items-center gap-2 rounded-xl gradient-brand px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-elevated transition-all hover:-translate-y-0.5",
								children: ["Get started", /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4 transition-transform group-hover:translate-x-0.5" })]
							})
						}),
						/* @__PURE__ */ jsx("dl", {
							className: "mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6",
							children: [
								{
									k: "37%",
									v: "Lower default risk"
								},
								{
									k: "12×",
									v: "Faster underwriting"
								},
								{
									k: "1.2M",
									v: "Farmers indexed"
								}
							].map((s) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("dt", {
								className: "text-2xl font-semibold text-white",
								children: s.k
							}), /* @__PURE__ */ jsx("dd", {
								className: "text-xs text-white/60 mt-1",
								children: s.v
							})] }, s.v))
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "relative flex items-center justify-center",
					children: [/* @__PURE__ */ jsx("div", { className: "absolute inset-0 -z-10 rounded-3xl bg-accent-blue/20 blur-3xl" }), /* @__PURE__ */ jsx("div", {
						className: "relative w-full overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-elevated backdrop-blur-md",
						children: /* @__PURE__ */ jsx("img", {
							src: dashboard_mock_default,
							alt: "KilimoLens risk intelligence dashboard",
							width: 1600,
							height: 1100,
							className: "w-full"
						})
					})]
				})]
			})
		]
	});
}
function SectionHead({ eyebrow, title, desc }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "mx-auto max-w-2xl text-center",
		children: [
			eyebrow ? /* @__PURE__ */ jsx("span", {
				className: "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-brand-blue",
				children: eyebrow
			}) : null,
			/* @__PURE__ */ jsx("h2", {
				className: "mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl",
				children: title
			}),
			desc && /* @__PURE__ */ jsx("p", {
				className: "mt-4 text-base text-muted-foreground leading-relaxed",
				children: desc
			})
		]
	});
}
function Problem() {
	return /* @__PURE__ */ jsx("section", {
		className: "py-24 sm:py-32",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-7xl px-6 lg:px-8",
			children: [/* @__PURE__ */ jsx(SectionHead, {
				title: /* @__PURE__ */ jsxs(Fragment, { children: ["Agricultural lending is built on ", /* @__PURE__ */ jsx("span", {
					className: "text-gradient-brand",
					children: "incomplete data."
				})] }),
				desc: "Financial institutions struggle to assess agricultural risk because farmer data is fragmented across climate systems, field reports and financial records."
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-16 grid gap-6 md:grid-cols-3",
				children: [
					{
						icon: Layers,
						title: "Fragmented farmer data",
						body: "Information lives in silos — cooperative records, paper logs, mobile money, and informal field reports never reach the credit officer."
					},
					{
						icon: CloudRain,
						title: "Climate uncertainty",
						body: "Rainfall, drought and seasonal volatility shift faster than traditional underwriting models can respond."
					},
					{
						icon: ShieldCheck,
						title: "High lending risk exposure",
						body: "Without unified insight, lenders price risk blindly — driving defaults up and shutting good farmers out."
					}
				].map((c) => /* @__PURE__ */ jsxs("div", {
					className: "group rounded-2xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "inline-flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive",
							children: /* @__PURE__ */ jsx(c.icon, { className: "h-5 w-5" })
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "mt-5 text-lg font-semibold text-foreground",
							children: c.title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-muted-foreground leading-relaxed",
							children: c.body
						})
					]
				}, c.title))
			})]
		})
	});
}
function Solution() {
	return /* @__PURE__ */ jsxs("section", {
		id: "features",
		className: "relative bg-surface py-24 sm:py-32",
		children: [/* @__PURE__ */ jsx("div", {
			className: "absolute inset-0 grid-bg opacity-60",
			"aria-hidden": true
		}), /* @__PURE__ */ jsxs("div", {
			className: "relative mx-auto max-w-7xl px-6 lg:px-8",
			children: [/* @__PURE__ */ jsx(SectionHead, {
				title: /* @__PURE__ */ jsxs(Fragment, { children: ["One platform for ", /* @__PURE__ */ jsx("span", {
					className: "text-gradient-brand",
					children: "Farmer Risk Intelligence."
				})] }),
				desc: "KilimoLens aggregates climate, satellite and agricultural data into an explainable risk and resilience layer your credit team can act on."
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
				children: [
					{
						icon: CloudRain,
						title: "Climate Risk Scoring",
						body: "Quantify weather, drought and seasonal exposure per farm, per crop, per cycle."
					},
					{
						icon: Sprout,
						title: "Farmer Resilience Index",
						body: "Measure operational, financial and adaptive resilience with a single composite score."
					},
					{
						icon: Satellite,
						title: "Satellite Data Intelligence",
						body: "Ground-truth vegetation, land use and yield potential from multi-spectral imagery."
					},
					{
						icon: Brain,
						title: "Explainable AI Insights",
						body: "Every score is traceable — show the drivers a credit committee actually trusts."
					},
					{
						icon: FileBarChart,
						title: "Lending Recommendations",
						body: "Approve, restructure or decline with model-suggested loan size, tenor and pricing."
					},
					{
						icon: Database,
						title: "Unified Farmer Profile",
						body: "One record, every signal — climate, cooperative, agronomic and financial."
					}
				].map((f) => /* @__PURE__ */ jsxs("div", {
					className: "group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card",
					children: [
						/* @__PURE__ */ jsx("div", { className: "absolute -right-12 -top-12 h-32 w-32 rounded-full gradient-soft opacity-0 transition-opacity group-hover:opacity-100" }),
						/* @__PURE__ */ jsx("div", {
							className: "relative inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-primary-foreground shadow-card",
							children: /* @__PURE__ */ jsx(f.icon, { className: "h-5 w-5" })
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "relative mt-5 text-lg font-semibold text-foreground",
							children: f.title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "relative mt-2 text-sm text-muted-foreground leading-relaxed",
							children: f.body
						})
					]
				}, f.title))
			})]
		})]
	});
}
function HowItWorks() {
	return /* @__PURE__ */ jsx("section", {
		id: "how",
		className: "py-24 sm:py-32",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-7xl px-6 lg:px-8",
			children: [/* @__PURE__ */ jsx(SectionHead, { title: /* @__PURE__ */ jsxs(Fragment, { children: ["From raw signal to ", /* @__PURE__ */ jsx("span", {
				className: "text-gradient-brand",
				children: "a confident decision."
			})] }) }), /* @__PURE__ */ jsx("ol", {
				className: "relative mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-5",
				children: [
					{
						icon: Sprout,
						title: "Capture loan input",
						body: "Farmer location, crops, cooperative and livestock data enters via lender portal or API."
					},
					{
						icon: Satellite,
						title: "Enrich with climate & satellite",
						body: "We layer historical and real-time geospatial signals onto every applicant."
					},
					{
						icon: Brain,
						title: "Run AI risk & resilience models",
						body: "Ensemble models score climate, operational and financial exposure."
					},
					{
						icon: Lightbulb,
						title: "Generate explainable insights",
						body: "Each decision ships with human-readable drivers and confidence ranges."
					},
					{
						icon: Activity,
						title: "Decide with confidence",
						body: "Approve, adjust or escalate — straight from the lending dashboard."
					}
				].map((s, i) => /* @__PURE__ */ jsxs("li", {
					className: "relative rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ jsxs("span", {
								className: "text-xs font-mono font-semibold text-brand-blue",
								children: ["0", i + 1]
							}), /* @__PURE__ */ jsx("div", {
								className: "inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary",
								children: /* @__PURE__ */ jsx(s.icon, { className: "h-4 w-4" })
							})]
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "mt-5 text-base font-semibold text-foreground",
							children: s.title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-muted-foreground leading-relaxed",
							children: s.body
						})
					]
				}, s.title))
			})]
		})
	});
}
function UseCases() {
	return /* @__PURE__ */ jsx("section", {
		id: "solutions",
		className: "bg-surface py-24 sm:py-32",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-7xl px-6 lg:px-8",
			children: [/* @__PURE__ */ jsx(SectionHead, { title: /* @__PURE__ */ jsxs(Fragment, { children: ["Every actor in the ", /* @__PURE__ */ jsx("span", {
				className: "text-gradient-brand",
				children: "agricultural-finance stack."
			})] }) }), /* @__PURE__ */ jsx("div", {
				className: "mt-16 grid gap-6 lg:grid-cols-3",
				children: [
					{
						icon: Building2,
						tag: "SACCOs & MFIs",
						title: "Better loan decisions at the last mile",
						body: "Equip community-based lenders with institutional-grade risk insight on every smallholder applicant.",
						points: [
							"Pre-approval scoring",
							"Cooperative-level dashboards",
							"Mobile-first credit officer flow"
						]
					},
					{
						icon: Landmark,
						tag: "Banks",
						title: "Reduced default risk at scale",
						body: "Plug KilimoLens into existing core banking and origination systems via API.",
						points: [
							"Portfolio climate stress tests",
							"Automated underwriting",
							"Regulatory-ready audit trails"
						]
					},
					{
						icon: Umbrella,
						tag: "Insurers",
						title: "Improved risk visibility & pricing",
						body: "Underwrite parametric and indemnity products with sharper geospatial context.",
						points: [
							"Granular peril modelling",
							"Claims triage support",
							"Cohort resilience tracking"
						]
					}
				].map((c) => /* @__PURE__ */ jsxs("article", {
					className: "flex flex-col rounded-2xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "inline-flex h-11 w-11 items-center justify-center rounded-xl gradient-brand text-primary-foreground shadow-card",
								children: /* @__PURE__ */ jsx(c.icon, { className: "h-5 w-5" })
							}), /* @__PURE__ */ jsx("span", {
								className: "text-xs font-semibold uppercase tracking-wider text-brand-blue",
								children: c.tag
							})]
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "mt-5 text-lg font-semibold text-foreground",
							children: c.title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-2 text-sm text-muted-foreground leading-relaxed",
							children: c.body
						}),
						/* @__PURE__ */ jsx("ul", {
							className: "mt-6 space-y-2.5 border-t border-border pt-5",
							children: c.points.map((p) => /* @__PURE__ */ jsxs("li", {
								className: "flex items-start gap-2 text-sm text-foreground/80",
								children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary-soft" }), p]
							}, p))
						})
					]
				}, c.tag))
			})]
		})
	});
}
function ValueProp() {
	return /* @__PURE__ */ jsx("section", {
		id: "pricing",
		className: "py-24 sm:py-32",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-7xl px-6 lg:px-8",
			children: [/* @__PURE__ */ jsx(SectionHead, {
				title: /* @__PURE__ */ jsxs(Fragment, { children: ["One platform. ", /* @__PURE__ */ jsx("span", {
					className: "text-gradient-brand",
					children: "Aligned outcomes."
				})] }),
				desc: "When climate, farmer and financial data converge, every stakeholder wins."
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-16 grid gap-6 md:grid-cols-3",
				children: [
					{
						tag: "For Farmers",
						icon: Sprout,
						points: [
							"Better access to finance",
							"Recognition of resilience",
							"Fairer, data-backed pricing"
						]
					},
					{
						tag: "For Lenders",
						icon: LineChart,
						points: [
							"Better risk visibility",
							"Lower defaults",
							"Faster credit decisions"
						]
					},
					{
						tag: "For Climate Finance",
						icon: Brain,
						points: [
							"Smarter capital allocation",
							"Data-driven decisions",
							"Measurable adaptation impact"
						]
					}
				].map((c) => /* @__PURE__ */ jsxs("div", {
					className: "rounded-2xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ jsx("h3", {
							className: "text-base font-semibold text-foreground",
							children: c.tag
						}), /* @__PURE__ */ jsx("div", {
							className: "inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue-soft text-brand-blue",
							children: /* @__PURE__ */ jsx(c.icon, { className: "h-4 w-4" })
						})]
					}), /* @__PURE__ */ jsx("ul", {
						className: "mt-6 space-y-3",
						children: c.points.map((p) => /* @__PURE__ */ jsxs("li", {
							className: "flex items-start gap-2 text-sm text-foreground/85",
							children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "mt-0.5 h-4 w-4 shrink-0 text-primary-soft" }), p]
						}, p))
					})]
				}, c.tag))
			})]
		})
	});
}
function CTA() {
	return /* @__PURE__ */ jsx("section", {
		id: "cta",
		className: "px-6 pb-24 sm:pb-32 lg:px-8",
		children: /* @__PURE__ */ jsxs("div", {
			className: "relative mx-auto max-w-6xl overflow-hidden rounded-3xl gradient-brand p-12 sm:p-16 shadow-elevated",
			children: [
				/* @__PURE__ */ jsx("div", { className: "absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-blue/40 blur-3xl" }),
				/* @__PURE__ */ jsx("div", { className: "absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-primary-soft/50 blur-3xl" }),
				/* @__PURE__ */ jsxs("div", {
					className: "relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
						className: "text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl",
						children: "Ready to see agricultural risk clearly?"
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-4 max-w-xl text-base text-primary-foreground/80 leading-relaxed",
						children: "Get a guided walkthrough of KilimoLens with your portfolio data. We'll show you risk scoring, satellite intelligence and lending decision support — live."
					})] }), /* @__PURE__ */ jsxs("form", {
						onSubmit: (e) => e.preventDefault(),
						className: "flex flex-col gap-3 sm:flex-row lg:flex-col",
						children: [/* @__PURE__ */ jsx("input", {
							type: "email",
							required: true,
							placeholder: "you@institution.com",
							className: "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/55 backdrop-blur outline-none transition focus:border-white/40 focus:bg-white/15"
						}), /* @__PURE__ */ jsxs("button", {
							type: "submit",
							className: "group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary shadow-card transition-transform hover:-translate-y-0.5",
							children: ["Request Demo", /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4 transition-transform group-hover:translate-x-0.5" })]
						})]
					})]
				})
			]
		})
	});
}
function Footer() {
	return /* @__PURE__ */ jsx("footer", {
		className: "border-t border-border bg-surface",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-7xl px-6 py-14 lg:px-8",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "grid gap-10 md:grid-cols-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "md:col-span-2",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ jsx("span", {
									className: "grid h-8 w-8 place-items-center rounded-lg gradient-brand text-primary-foreground",
									children: /* @__PURE__ */ jsx(Satellite, { className: "h-4 w-4" })
								}), /* @__PURE__ */ jsxs("span", {
									className: "text-base font-semibold tracking-tight",
									children: ["Kilimo", /* @__PURE__ */ jsx("span", {
										className: "text-gradient-brand",
										children: "Lens"
									})]
								})]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed",
								children: "Climate-finance intelligence for the institutions reshaping how agriculture gets capitalised."
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-6 flex gap-3",
								children: [
									Twitter,
									Linkedin,
									Github
								].map((Icon, i) => /* @__PURE__ */ jsx("a", {
									href: "#",
									className: "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-brand-blue",
									children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" })
								}, i))
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h4", {
						className: "text-sm font-semibold text-foreground",
						children: "Platform"
					}), /* @__PURE__ */ jsxs("ul", {
						className: "mt-4 space-y-2.5 text-sm text-muted-foreground",
						children: [
							/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
								href: "#features",
								className: "hover:text-foreground",
								children: "Features"
							}) }),
							/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
								href: "#how",
								className: "hover:text-foreground",
								children: "How It Works"
							}) }),
							/* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
								href: "#solutions",
								className: "hover:text-foreground",
								children: "Solutions"
							}) })
						]
					})] }),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h4", {
						className: "text-sm font-semibold text-foreground",
						children: "Contact"
					}), /* @__PURE__ */ jsxs("ul", {
						className: "mt-4 space-y-2.5 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ jsx("li", { children: "hello@kilimolens.ai" }), /* @__PURE__ */ jsx("li", { children: "Nairobi · Remote" })]
					})] })
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center",
				children: [/* @__PURE__ */ jsxs("p", {
					className: "text-xs text-muted-foreground",
					children: [
						"© ",
						(/* @__PURE__ */ new Date()).getFullYear(),
						" KilimoLens. All rights reserved."
					]
				}), /* @__PURE__ */ jsx("p", {
					className: "text-xs text-muted-foreground",
					children: "Built for climate-resilient agricultural finance."
				})]
			})]
		})
	});
}
function Landing() {
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen bg-background text-foreground",
		children: [
			/* @__PURE__ */ jsx(Navbar, {}),
			/* @__PURE__ */ jsxs("main", { children: [
				/* @__PURE__ */ jsx(Hero, {}),
				/* @__PURE__ */ jsx(Problem, {}),
				/* @__PURE__ */ jsx(Solution, {}),
				/* @__PURE__ */ jsx(HowItWorks, {}),
				/* @__PURE__ */ jsx(UseCases, {}),
				/* @__PURE__ */ jsx(ValueProp, {}),
				/* @__PURE__ */ jsx(CTA, {})
			] }),
			/* @__PURE__ */ jsx(Footer, {})
		]
	});
}
//#endregion
export { Landing as component };
