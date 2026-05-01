       {/* Weekly chart */}
      {weeklyChartData.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-medium text-white mb-3">Weekly Calories</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short' })} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '0.5rem' }} />
                <Bar dataKey="calories" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}