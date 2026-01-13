"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestSessionPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [testQueryResult, setTestQueryResult] = useState<any>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    // Check session
    const { data: { session }, error } = await supabase.auth.getSession();
    setSessionInfo({ session, error, hasSession: !!session });

    // Check localStorage
    const storageKey = 'sb-kviciiartofmqbsbrqii-auth-token';
    const storageValue = localStorage.getItem(storageKey);
    setStorageInfo({
      key: storageKey,
      exists: !!storageValue,
      value: storageValue ? JSON.parse(storageValue) : null
    });

    // Try a test query
    if (session) {
      const result = await supabase
        .from("invoices")
        .select("*")
        .limit(1);
      setTestQueryResult(result);
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-4">
      <h1 className="text-3xl font-bold">Session Debug Page</h1>

      <Card>
        <CardHeader>
          <CardTitle>Session Info</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>LocalStorage Info</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(storageInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Query Result</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(testQueryResult, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Button onClick={checkSession}>Refresh</Button>
    </div>
  );
}
