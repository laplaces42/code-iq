// Generate dummy trend data for the past 30 days
export function generateTrendData(repoId) {
  const data = [];
  const today = new Date();

  // Generate data for the past 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Create some realistic trend patterns based on repo characteristics
    const baseHealth = 7.5;
    const baseSecurity = 8.0;
    const baseKnowledge = 6.8;

    // Add some realistic variation with slight upward trend
    const dayProgress = (29 - i) / 29; // 0 to 1 over time
    const randomVariation = () => (Math.random() - 0.5) * 0.8; // -0.4 to 0.4

    const health = Math.max(
      0,
      Math.min(10, baseHealth + dayProgress * 0.5 + randomVariation())
    );
    const security = Math.max(
      0,
      Math.min(10, baseSecurity + dayProgress * 0.3 + randomVariation())
    );
    const knowledge = Math.max(
      0,
      Math.min(10, baseKnowledge + dayProgress * 0.7 + randomVariation())
    );
    const overall = (health + security + knowledge) / 3;

    data.push({
      date: date.toISOString().split("T")[0],
      overall: Math.round(overall * 10) / 10,
      health: Math.round(health * 10) / 10,
      security: Math.round(security * 10) / 10,
      knowledge: Math.round(knowledge * 10) / 10,
    });
  }

  return data;
}

// Generate weekly summary data for the past 12 weeks
export function generateWeeklyTrendData(repoId) {
  const data = [];
  const today = new Date();

  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - i * 7);

    const baseHealth = 7.2;
    const baseSecurity = 7.8;
    const baseKnowledge = 6.5;

    const weekProgress = (11 - i) / 11;
    const randomVariation = () => (Math.random() - 0.5) * 1.2;

    const health = Math.max(
      0,
      Math.min(10, baseHealth + weekProgress * 1.0 + randomVariation())
    );
    const security = Math.max(
      0,
      Math.min(10, baseSecurity + weekProgress * 0.8 + randomVariation())
    );
    const knowledge = Math.max(
      0,
      Math.min(10, baseKnowledge + weekProgress * 1.2 + randomVariation())
    );
    const overall = (health + security + knowledge) / 3;

    data.push({
      date: weekStart.toISOString().split("T")[0],
      overall: Math.round(overall * 10) / 10,
      health: Math.round(health * 10) / 10,
      security: Math.round(security * 10) / 10,
      knowledge: Math.round(knowledge * 10) / 10,
    });
  }

  return data;
}

// Generate historical data with major events/improvements
export function generateHistoricalData(repoId) {
  const events = [
    {
      date: "2024-12-01",
      type: "security_scan",
      impact: { security: 1.2, health: 0.3 },
    },
    {
      date: "2024-12-15",
      type: "code_review",
      impact: { health: 0.8, knowledge: 0.5 },
    },
    {
      date: "2025-01-01",
      type: "dependency_update",
      impact: { security: 0.9, health: 0.4 },
    },
    {
      date: "2025-01-15",
      type: "documentation",
      impact: { knowledge: 1.1, health: 0.2 },
    },
    {
      date: "2025-02-01",
      type: "refactoring",
      impact: { health: 1.0, knowledge: 0.6 },
    },
  ];

  const data = [];
  const startDate = new Date("2024-11-01");
  const endDate = new Date();

  let currentScores = {
    health: 6.5,
    security: 7.0,
    knowledge: 6.0,
  };

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];

    // Check if there's an event on this date
    const event = events.find((e) => e.date === dateStr);
    if (event) {
      Object.keys(event.impact).forEach((metric) => {
        currentScores[metric] = Math.min(
          10,
          currentScores[metric] + event.impact[metric]
        );
      });
    }

    // Add small random daily variations
    Object.keys(currentScores).forEach((metric) => {
      const variation = (Math.random() - 0.5) * 0.2;
      currentScores[metric] = Math.max(
        0,
        Math.min(10, currentScores[metric] + variation)
      );
    });

    const overall =
      (currentScores.health +
        currentScores.security +
        currentScores.knowledge) /
      3;

    data.push({
      date: dateStr,
      overall: Math.round(overall * 10) / 10,
      health: Math.round(currentScores.health * 10) / 10,
      security: Math.round(currentScores.security * 10) / 10,
      knowledge: Math.round(currentScores.knowledge * 10) / 10,
    });
  }

  return data;
}
