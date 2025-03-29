import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Truck, Bus, Map, BarChart, Clock, Users, AlertTriangle, Fuel } from "lucide-react";

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const [isLightMode, setIsLightMode] = useState(false);
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  });

  // Responsive screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width <= 640,
        isTablet: width > 640 && width <= 1024,
        isDesktop: width > 1024
      });
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { isMobile, isTablet, isDesktop } = screenSize;

  const darkModeStyles = {
    background: "#090212",
    textColor: "#d1d5db",
    cardBg: "#0f172a",
    gradient: "linear-gradient(to bottom, #090212, #120218, #090212)",
    buttonHover: "rgba(34, 211, 238, 0.2)",
    secondaryButtonHover: "rgba(232, 121, 249, 0.2)",
  };

  const lightModeStyles = {
    background: "linear-gradient(to right, #E2E8F0, #F1F5F9)",
    textColor: "#1E293B",
    cardBg: "#FFFFFF",
    gradient: "linear-gradient(to right, #E2E8F0, #F1F5F9)",
    buttonHover: "#DBEAFE",
    secondaryButtonHover: "#EDE9FE",
  };

  const currentTheme = isLightMode ? lightModeStyles : darkModeStyles;

  return (
    <>
      <style>{`
        @keyframes slide {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100vw); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        /* Responsive Base Styles */
        body, html {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          overflow-x: hidden;
        }
        
        /* Improved accessibility */
        button:focus, input:focus {
          outline: 2px solid #22D3EE;
          outline-offset: 2px;
        }
      `}</style>
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          width: "100%",
          overflow: "hidden",
          background: currentTheme.background,
          transition: "background 0.3s ease",
          maxWidth: "100vw",
        }}
      >
        {/* Theme Toggle */}
        <div
          style={{
            position: "absolute",
            top: isMobile ? "0.5rem" : isTablet ? "0.75rem" : "1rem",
            right: isMobile ? "0.5rem" : isTablet ? "0.75rem" : "1rem",
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "0.25rem" : "0.5rem",
          }}
        >
          <label
            style={{
              color: currentTheme.textColor,
              fontSize: isMobile ? "0.75rem" : isTablet ? "0.85rem" : "0.9rem",
              fontWeight: "500",
            }}
          >
            {isLightMode ? "Light" : "Dark"}
          </label>
          <input
            type="checkbox"
            checked={isLightMode}
            onChange={() => setIsLightMode(!isLightMode)}
            style={{
              appearance: "none",
              width: isMobile ? "30px" : isTablet ? "36px" : "40px",
              height: isMobile ? "16px" : isTablet ? "18px" : "20px",
              background: isLightMode ? "#64748B" : "#0f172a",
              borderRadius: "999px",
              position: "relative",
              cursor: "pointer",
              outline: "none",
              border: `2px solid ${isLightMode ? "#64748B" : "#E879F9"}`,
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => (e.target.style.opacity = "0.8")}
            onMouseOut={(e) => (e.target.style.opacity = "1")}
          />
          <span
            style={{
              position: "absolute",
              width: isMobile ? "12px" : isTablet ? "14px" : "16px",
              height: isMobile ? "12px" : isTablet ? "14px" : "16px",
              background: isLightMode ? "#1E293B" : "#E879F9",
              borderRadius: "50%",
              top: isMobile ? "0.75rem" : isTablet ? "1rem" : "1.5rem",
              right: isLightMode 
                ? (isMobile ? "0.75rem" : isTablet ? "1rem" : "1.25rem") 
                : (isMobile ? "1.75rem" : isTablet ? "2rem" : "2.25rem"),
              transition: "all 0.3s ease",
            }}
          />
        </div>

        {/* Background gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: currentTheme.gradient,
            transition: "background 0.3s ease",
          }}
        />
        
        {/* Animated vehicle icons - hidden on mobile and tablet for performance */}
        {isDesktop && (
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <Car
              style={{
                position: "absolute",
                top: "15%",
                left: "100%",
                color: "#22D3EE",
                animation: "slide 18s linear infinite",
              }}
            />
            <Truck
              style={{
                position: "absolute",
                top: "45%",
                left: "100%",
                color: "#E879F9",
                animation: "slide 25s linear infinite",
              }}
            />
            <Bus
              style={{
                position: "absolute",
                top: "75%",
                left: "100%",
                color: "#34D399",
                animation: "slide 22s linear infinite",
              }}
            />
          </div>
        )}
        
        {/* Main content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: isMobile ? "1rem" : isTablet ? "1.5rem" : "2rem",
            textAlign: "center",
            maxWidth: "100%",
          }}
        >
          <h1
            style={{
              fontSize: isMobile ? "clamp(1.5rem, 8vw, 2.5rem)" : isTablet ? "clamp(2.5rem, 6vw, 3rem)" : "3.5rem",
              fontWeight: "bold",
              color: isLightMode ? "#1E293B" : "white",
              background: "linear-gradient(to right, #22D3EE, #E879F9, #34D399)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "fadeIn 1s ease-in-out",
              lineHeight: isMobile ? "1.2" : isTablet ? "1.15" : "1.1",
              margin: isMobile ? "1rem 0" : "1.5rem 0",
              maxWidth: "100%",
              padding: "0 1rem",
            }}
          >
            FleetTraq: Command Your Fleet
          </h1>
          <p
            style={{
              marginTop: isMobile ? "0.5rem" : isTablet ? "1rem" : "1.5rem",
              fontSize: isMobile ? "0.9rem" : isTablet ? "1.2rem" : "1.5rem",
              color: currentTheme.textColor,
              maxWidth: isMobile ? "95%" : isTablet ? "90%" : "800px",
              animation: "fadeIn 1.5s ease-in-out",
              padding: "0 1rem",
            }}
          >
            Harness the power of advanced fleet tracking to optimize operations, enhance safety, and drive efficiency.
          </p>
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: isMobile ? "0.8rem" : isTablet ? "0.9rem" : "1rem",
              color: isLightMode ? "#64748B" : "#a1a1aa",
              animation: "fadeIn 2s ease-in-out",
              padding: "0 1rem",
            }}
          >
            "Navigate the future of fleet management with precision."
          </p>
          
          {/* Stats Section */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: isMobile ? "0.75rem" : isTablet ? "1.5rem" : "2rem",
              marginTop: isMobile ? "1rem" : isTablet ? "1.5rem" : "2rem",
              flexWrap: "wrap",
              animation: "fadeIn 2.5s ease-in-out",
              width: "100%",
              padding: "0 1rem",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h3 style={{ fontSize: isMobile ? "1.25rem" : isTablet ? "1.75rem" : "2rem", color: "#22D3EE", fontWeight: "bold" }}>
                500+
              </h3>
              <p style={{ color: currentTheme.textColor, fontSize: isMobile ? "0.75rem" : isTablet ? "0.85rem" : "1rem" }}>
                Fleets Tracked
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <h3 style={{ fontSize: isMobile ? "1.25rem" : isTablet ? "1.75rem" : "2rem", color: "#E879F9", fontWeight: "bold" }}>
                1M+
              </h3>
              <p style={{ color: currentTheme.textColor, fontSize: isMobile ? "0.75rem" : isTablet ? "0.85rem" : "1rem" }}>
                Miles Optimized
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <h3 style={{ fontSize: isMobile ? "1.25rem" : isTablet ? "1.75rem" : "2rem", color: "#34D399", fontWeight: "bold" }}>
                99.9%
              </h3>
              <p style={{ color: currentTheme.textColor, fontSize: isMobile ? "0.75rem" : isTablet ? "0.85rem" : "1rem" }}>
                Uptime
              </p>
            </div>
          </div>
          
          {/* Feature cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile 
                ? "1fr" 
                : isTablet 
                  ? "repeat(auto-fit, minmax(200px, 1fr))" 
                  : "repeat(auto-fit, minmax(250px, 1fr))",
              gap: isMobile ? "0.75rem" : isTablet ? "1rem" : "1.5rem",
              marginTop: isMobile ? "1.5rem" : isTablet ? "2.5rem" : "4rem",
              maxWidth: "1200px",
              width: isMobile ? "95%" : isTablet ? "90%" : "85%",
              animation: "fadeIn 2s ease-in-out",
            }}
          >
            {[
              {
                icon: <Car size={isMobile ? 20 : isTablet ? 24 : 32} />,
                title: "Real-Time GPS Tracking",
                description: "Monitor vehicle locations with pinpoint accuracy.",
                color: "#22D3EE",
              },
              {
                icon: <Map size={isMobile ? 20 : isTablet ? 24 : 32} />,
                title: "Dynamic Route Planning",
                description: "Reduce costs with AI-optimized routes.",
                color: "#E879F9",
              },
              {
                icon: <BarChart size={isMobile ? 20 : isTablet ? 24 : 32} />,
                title: "Fleet Performance Insights",
                description: "Analyze data to boost productivity.",
                color: "#34D399",
              },
              {
                icon: <Clock size={isMobile ? 20 : isTablet ? 24 : 32} />,
                title: "Predictive Maintenance",
                description: "Prevent downtime with proactive alerts.",
                color: "#818CF8",
              },
              {
                icon: <Users size={isMobile ? 20 : isTablet ? 24 : 32} />,
                title: "Driver Behavior Monitoring",
                description: "Enhance safety by tracking driver habits.",
                color: "#FBBF24",
              },
              {
                icon: <AlertTriangle size={isMobile ? 20 : isTablet ? 24 : 32} />,
                title: "Incident Reporting",
                description: "Manage incidents to maintain reliability.",
                color: "#EF4444",
              },
              {
                icon: <Fuel size={isMobile ? 20 : isTablet ? 24 : 32} />,
                title: "Fuel Efficiency Tracking",
                description: "Reduce waste with fuel analytics.",
                color: "#10B981",
              },
            ].map((feature, i) => (
              <div
                key={i}
                style={{
                  background: currentTheme.cardBg,
                  padding: isMobile ? "0.75rem" : isTablet ? "1.25rem" : "1.5rem",
                  borderRadius: "12px",
                  textAlign: "center",
                  border: `2px solid ${feature.color}`,
                  transition: "all 0.3s ease",
                  boxShadow: isLightMode ? "0 4px 6px rgba(0, 0, 0, 0.05)" : "none",
                  transform: "translateY(0)",
                  "&:hover": {
                    transform: "translateY(-5px)",
                  }
                }}
                onMouseOver={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = isLightMode 
                      ? "0 10px 15px rgba(0, 0, 0, 0.1)" 
                      : "0 10px 15px rgba(0, 0, 0, 0.3)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = isLightMode 
                      ? "0 4px 6px rgba(0, 0, 0, 0.05)" 
                      : "none";
                  }
                }}
              >
                <div style={{ color: feature.color, marginBottom: "0.5rem" }}>{feature.icon}</div>
                <h3
                  style={{
                    color: isLightMode ? "#1E293B" : "white",
                    fontSize: isMobile ? "0.9rem" : isTablet ? "1.1rem" : "1.2rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    color: isLightMode ? "#64748B" : "#a1a1aa",
                    marginTop: "0.5rem",
                    fontSize: isMobile ? "0.75rem" : isTablet ? "0.85rem" : "0.95rem",
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
          
          {/* Navigation buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? "0.75rem" : isTablet ? "1rem" : "1.5rem",
              marginTop: isMobile ? "1.5rem" : isTablet ? "3rem" : "4rem",
              animation: "fadeIn 2s ease-in-out",
              width: isMobile ? "95%" : isTablet ? "auto" : "auto",
              padding: "0 1rem",
            }}
          >
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: isMobile ? "0.5rem 1.25rem" : isTablet ? "0.6rem 2rem" : "0.75rem 2.5rem",
                fontSize: isMobile ? "0.9rem" : isTablet ? "1rem" : "1.1rem",
                fontWeight: "bold",
                color: isLightMode ? "#1E293B" : "white",
                background: currentTheme.cardBg,
                border: "2px solid #22D3EE",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: isLightMode ? "0 2px 4px rgba(0, 0, 0, 0.05)" : "none",
                width: isMobile ? "100%" : "auto",
              }}
              onMouseOver={(e) => {
                e.target.style.background = currentTheme.buttonHover;
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.target.style.background = currentTheme.cardBg;
                e.target.style.transform = "translateY(0)";
              }}
              onFocus={(e) => {
                e.target.style.outline = "2px solid #22D3EE";
                e.target.style.outlineOffset = "2px";
              }}
            >
              LOGIN
            </button>
            <button
              onClick={() => navigate("/signup")}
              style={{
                padding: isMobile ? "0.5rem 1.25rem" : isTablet ? "0.6rem 2rem" : "0.75rem 2.5rem",
                fontSize: isMobile ? "0.9rem" : isTablet ? "1rem" : "1.1rem",
                fontWeight: "bold",
                color: isLightMode ? "#1E293B" : "white",
                background: currentTheme.cardBg,
                border: "2px solid #E879F9",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: isLightMode ? "0 2px 4px rgba(0, 0, 0, 0.05)" : "none",
                width: isMobile ? "100%" : "auto",
              }}
              onMouseOver={(e) => {
                e.target.style.background = currentTheme.secondaryButtonHover;
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.target.style.background = currentTheme.cardBg;
                e.target.style.transform = "translateY(0)";
              }}
              onFocus={(e) => {
                e.target.style.outline = "2px solid #E879F9";
                e.target.style.outlineOffset = "2px";
              }}
            >
              SIGNUP
            </button>
          </div>
          
          {/* Additional Info */}
          <div
            style={{
              marginTop: isMobile ? "1.5rem" : isTablet ? "2.5rem" : "3rem",
              marginBottom: isMobile ? "1.5rem" : isTablet ? "2rem" : "2rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              animation: "fadeIn 2.5s ease-in-out",
              width: "100%",
              padding: "0 1rem",
            }}
          >
            <p
              style={{
                fontSize: isMobile ? "0.75rem" : isTablet ? "0.85rem" : "1rem",
                color: isLightMode ? "#64748B" : "#a1a1aa",
                textAlign: "center",
                maxWidth: "100%",
              }}
            >
              Trusted by fleet managers worldwide | © 2025 FleetTraq
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? "0.5rem" : isTablet ? "1.5rem" : "2rem",
                width: "100%",
                justifyContent: "center",
              }}
            >
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WelcomeScreen;
