#!/usr/bin/env python3
"""Serve Inicio and proxy public Mastercard quotes without sending user amounts."""
import argparse
from collections import OrderedDict
from datetime import date, datetime, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import math
from pathlib import Path
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent
RATE_ENDPOINT = 'https://www.mastercard.com/marketingservices/public/mccom-services/currency-conversions/conversion-rates'
CACHE_TTL = 3600
MAX_PAIRS = 40
_quotes = OrderedDict()
_quote_lock = threading.Lock()


def quote(from_currency, to_currency):
    """Fetch a one-unit, zero-bank-fee quote from the public official website."""
    pair = (from_currency, to_currency)
    now = time.monotonic()
    with _quote_lock:
        entry = _quotes.get(pair)
        if entry and now - entry[0] < CACHE_TTL:
            _quotes.move_to_end(pair)
            return entry[1]
    query = urllib.parse.urlencode({
        'exchange_date': '0000-00-00',
        'transaction_currency': from_currency,
        'cardholder_billing_currency': to_currency,
        'bank_fee': '0',
        'transaction_amount': '1',
    })
    request = urllib.request.Request(RATE_ENDPOINT + '?' + query, headers={
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
    })
    with urllib.request.urlopen(request, timeout=10) as response:
        if response.status != 200:
            raise ValueError('Unexpected provider response')
        payload = json.loads(response.read(65536))
    if not isinstance(payload, dict):
        raise ValueError('Unexpected provider response')
    data = payload.get('data', {})
    if not isinstance(data, dict) or data.get('transCurr') != from_currency or data.get('crdhldBillCurr') != to_currency:
        raise ValueError('Unexpected currency pair')
    amount = float(data.get('transAmt', 0))
    converted = float(data.get('crdhldBillAmt', 0))
    bank_fee = float(data.get('bankFee', 0))
    if amount != 1 or bank_fee != 0 or not math.isfinite(converted) or converted <= 0:
        raise ValueError('Invalid quote')
    fx_date = data.get('fxDate', '')
    if not isinstance(fx_date, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', fx_date):
        raise ValueError('Invalid rate date')
    date.fromisoformat(fx_date)
    result = {
        'rate': converted,
        'from': from_currency,
        'to': to_currency,
        'date': fx_date,
        'updatedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        'source': 'Mastercard',
        'bankFee': 0,
    }
    with _quote_lock:
        _quotes[pair] = (time.monotonic(), result)
        _quotes.move_to_end(pair)
        while len(_quotes) > MAX_PAIRS:
            _quotes.popitem(last=False)
    return result


class Handler(SimpleHTTPRequestHandler):
    def send_json(self, status, body):
        encoded = json.dumps(body, ensure_ascii=False, allow_nan=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(encoded)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        try:
            self.end_headers()
            self.wfile.write(encoded)
        except (BrokenPipeError, ConnectionResetError):
            # Changing pairs can cancel the previous browser request.
            pass

    def do_GET(self):
        parsed = urllib.parse.urlsplit(self.path)
        if parsed.path == '/api/currency':
            values = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)
            if set(values) != {'from', 'to'} or any(len(value) != 1 for value in values.values()):
                self.send_json(400, {'message': 'Indica las dos divisas con sus códigos de tres letras.'})
                return
            from_currency = values['from'][0].upper()
            to_currency = values['to'][0].upper()
            if not all(re.fullmatch(r'[A-Z]{3}', value) for value in (from_currency, to_currency)):
                self.send_json(400, {'message': 'Los códigos de divisa deben tener tres letras.'})
                return
            try:
                self.send_json(200, quote(from_currency, to_currency))
            except (urllib.error.URLError, TimeoutError, ValueError, TypeError, OverflowError):
                self.send_json(502, {'message': 'No se pudo consultar Mastercard. Inténtalo de nuevo más tarde.'})
            return
        if parsed.path.startswith('/api/'):
            self.send_json(404, {'message': 'Servicio no disponible.'})
            return
        # Prevent accidentally publishing Git metadata or hidden local configuration.
        if any(part.startswith('.') and part not in ('.', '..') for part in urllib.parse.unquote(parsed.path).split('/')):
            self.send_error(404)
            return
        super().do_GET()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--bind', default='127.0.0.1')
    args = parser.parse_args()
    handler = partial(Handler, directory=str(ROOT))
    with ThreadingHTTPServer((args.bind, args.port), handler) as server:
        print(f'Inicio: http://{args.bind}:{args.port}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
