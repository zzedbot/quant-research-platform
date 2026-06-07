"""交易成本模型 — A股/港股差异化费率"""

CN_DEFAULTS = dict(
    commission=0.0003,
    stamp_tax=0.0005,
    slippage=0.001,
    transfer_fee=0.00001,
)

HK_DEFAULTS = dict(
    commission=0.0003,
    stamp_tax=0.0013,
    slippage=0.001,
    transfer_fee=0.00002,
)


class CostModel:
    """交易成本计算"""

    def __init__(self, market: str = "CN", **kwargs):
        defaults = CN_DEFAULTS if market == "CN" else HK_DEFAULTS
        self.commission = kwargs.get("commission", defaults["commission"])
        self.stamp_tax = kwargs.get("stamp_tax", defaults["stamp_tax"])
        self.slippage = kwargs.get("slippage", defaults["slippage"])
        self.transfer_fee = kwargs.get("transfer_fee", defaults["transfer_fee"])
        self.market = market

    def calc_cost(self, price: float, shares: float, is_buy: bool) -> dict:
        if is_buy:
            trade_price = price * (1 + self.slippage)
        else:
            trade_price = price * (1 - self.slippage)

        amount = trade_price * shares
        commission = max(amount * self.commission, 5.0)
        stamp = amount * self.stamp_tax if not is_buy else 0.0
        transfer = amount * self.transfer_fee
        total = commission + stamp + transfer

        return {
            "trade_price": round(trade_price, 4),
            "trade_amount": round(amount, 2),
            "commission": round(commission, 2),
            "stamp_tax": round(stamp, 2),
            "slippage_cost": round(amount * self.slippage, 2),
            "transfer_fee": round(transfer, 4),
            "total_cost": round(total, 2),
            "net_amount": round(amount + total if is_buy else amount - total, 2),
        }
