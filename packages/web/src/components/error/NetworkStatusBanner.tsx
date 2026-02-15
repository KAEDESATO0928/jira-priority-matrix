import { useState, useEffect } from 'react';

/**
 * ネットワーク接続状態を監視し、オフライン時にバナーを表示
 */
export function NetworkStatusBanner(): React.ReactElement | null {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);

  useEffect(() => {
    const handleOnline = (): void => {
      setIsOnline(true);
      setShowRecoveryBanner(true);

      // 3秒後に復旧バナーを非表示
      setTimeout(() => {
        setShowRecoveryBanner(false);
      }, 3000);
    };

    const handleOffline = (): void => {
      setIsOnline(false);
      setShowRecoveryBanner(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // オフライン時のバナー
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white py-2 px-4 text-center text-sm font-medium shadow-lg">
        インターネット接続が切断されました
      </div>
    );
  }

  // 復旧時のバナー（3秒間表示）
  if (showRecoveryBanner) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white py-2 px-4 text-center text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
        接続が回復しました
      </div>
    );
  }

  return null;
}
