import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { BOXES, ITEMS, openBox, RARITY_COLOR, RARITY_LABEL, type Box, type ShopItem } from '../data/shop';
import { getLevelForXp } from '../lib/levels';

export default function ShopScreen() {
  const { coins, xp, inventory, goBack, spendCoins, addToInventory } = useAppStore();
  const level = getLevelForXp(xp);

  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [revealedItems, setRevealedItems] = useState<ShopItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [error, setError] = useState('');

  const handleOpen = (box: Box) => {
    setError('');
    if (level.level < box.levelRequired) { setError('Level too low'); return; }
    if (!spendCoins(box.cost)) { setError('Not enough coins'); return; }
    const items = openBox(box);
    addToInventory(items);
    setRevealedItems(items);
    setVisibleCount(0);
    setRevealing(true);
    // Reveal items one by one
    items.forEach((_, i) => {
      setTimeout(() => setVisibleCount(i + 1), 400 + i * 600);
    });
  };

  const handleClose = () => {
    setRevealing(false);
    setRevealedItems([]);
    setVisibleCount(0);
    setSelectedBox(null);
  };

  // Inventory tab
  const [tab, setTab] = useState<'shop' | 'inventory'>('shop');
  const ownedItems = ITEMS.filter(i => (inventory[i.id] ?? 0) > 0);

  return (
    <div className="shop-screen">
      {/* Top bar */}
      <div className="shop-topbar">
        <button className="shop-back-btn" onClick={goBack}>←</button>
        <span className="shop-title">🛍️ Shop</span>
        <div className="shop-coins">
          <span className="shop-coins-icon">🪙</span>
          <span className="shop-coins-val">{coins.toLocaleString()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="shop-tabs">
        <button className={`shop-tab ${tab === 'shop' ? 'shop-tab--active' : ''}`} onClick={() => setTab('shop')}>Packs</button>
        <button className={`shop-tab ${tab === 'inventory' ? 'shop-tab--active' : ''}`} onClick={() => setTab('inventory')}>
          Inventory {ownedItems.length > 0 && <span className="shop-inv-badge">{ownedItems.length}</span>}
        </button>
      </div>

      <div className="shop-scroll">
        {tab === 'shop' && (
          <>
            <p className="shop-hint">Earn coins by completing lessons and answering correctly.</p>
            <div className="shop-boxes">
              {BOXES.map(box => {
                const locked = level.level < box.levelRequired;
                const cantAfford = coins < box.cost;
                return (
                  <div
                    key={box.id}
                    className={`shop-box ${locked ? 'shop-box--locked' : ''} ${selectedBox?.id === box.id ? 'shop-box--selected' : ''}`}
                    style={{ '--box-color': box.color } as React.CSSProperties}
                    onClick={() => !locked && setSelectedBox(selectedBox?.id === box.id ? null : box)}
                  >
                    <div className="shop-box-emoji">{box.emoji}</div>
                    <div className="shop-box-name">{box.name}</div>
                    <div className="shop-box-desc">{box.description}</div>
                    {locked
                      ? <div className="shop-box-locked">🔒 Level {box.levelRequired}</div>
                      : <div className="shop-box-cost">🪙 {box.cost.toLocaleString()}</div>
                    }

                    {selectedBox?.id === box.id && !locked && (
                      <div className="shop-box-detail" onClick={e => e.stopPropagation()}>
                        <div className="shop-odds">
                          {(Object.entries(box.rarityWeights) as [string, number][])
                            .filter(([, w]) => w > 0)
                            .map(([rarity, weight]) => {
                              const total = Object.values(box.rarityWeights).reduce((a, b) => a + b, 0);
                              const pct = Math.round((weight / total) * 100);
                              return (
                                <div key={rarity} className="shop-odd-row">
                                  <span className="shop-odd-dot" style={{ background: RARITY_COLOR[rarity as keyof typeof RARITY_COLOR] }} />
                                  <span className="shop-odd-label">{RARITY_LABEL[rarity as keyof typeof RARITY_LABEL]}</span>
                                  <span className="shop-odd-pct">{pct}%</span>
                                </div>
                              );
                            })}
                        </div>
                        <div className="shop-items-per">
                          {box.itemsPerOpen} item{box.itemsPerOpen > 1 ? 's' : ''} per open
                        </div>
                        {error && <div className="shop-error">{error}</div>}
                        <button
                          className="shop-open-btn"
                          disabled={cantAfford}
                          onClick={() => handleOpen(box)}
                        >
                          {cantAfford ? `Need ${(box.cost - coins).toLocaleString()} more 🪙` : `Open — 🪙 ${box.cost.toLocaleString()}`}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'inventory' && (
          <div className="shop-inventory">
            {ownedItems.length === 0
              ? <div className="shop-inv-empty">Your inventory is empty. Open some packs!</div>
              : ownedItems.map(item => (
                  <div key={item.id} className="shop-inv-item" style={{ '--rarity-color': RARITY_COLOR[item.rarity] } as React.CSSProperties}>
                    <span className="shop-inv-emoji">{item.emoji}</span>
                    <div className="shop-inv-info">
                      <div className="shop-inv-name">{item.name}</div>
                      <div className="shop-inv-desc">{item.description}</div>
                      <div className="shop-inv-rarity" style={{ color: RARITY_COLOR[item.rarity] }}>{RARITY_LABEL[item.rarity]}</div>
                    </div>
                    <div className="shop-inv-count">×{inventory[item.id]}</div>
                  </div>
                ))
            }
          </div>
        )}
      </div>

      {/* Reveal overlay */}
      {revealing && (
        <div className="shop-reveal-overlay" onClick={visibleCount >= revealedItems.length ? handleClose : undefined}>
          <div className="shop-reveal-panel">
            <h2 className="shop-reveal-title">You got...</h2>
            <div className="shop-reveal-items">
              {revealedItems.map((item, i) => (
                <div
                  key={i}
                  className={`shop-reveal-item ${i < visibleCount ? 'shop-reveal-item--visible' : ''}`}
                  style={{ '--rarity-color': RARITY_COLOR[item.rarity] } as React.CSSProperties}
                >
                  <div className="shop-reveal-glow" />
                  <div className="shop-reveal-emoji">{item.emoji}</div>
                  <div className="shop-reveal-name">{item.name}</div>
                  <div className="shop-reveal-rarity" style={{ color: RARITY_COLOR[item.rarity] }}>
                    {RARITY_LABEL[item.rarity]}
                  </div>
                  <div className="shop-reveal-desc">{item.description}</div>
                </div>
              ))}
            </div>
            {visibleCount >= revealedItems.length && (
              <button className="shop-reveal-close" onClick={handleClose}>Awesome! →</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
