'''

Conway's game of life — reference NumPy engine (no GUI).

The interactive, GPU-accelerated version lives in web/. This module is the
reference implementation used by the tests and for quick benchmarks.

'''
import argparse
from time import perf_counter

import numpy as np


def step(S, wrap=True):
    '''Return the next generation of the uint8 grid S.

    wrap=True  -> toroidal board (edges connect).
    wrap=False -> cells outside the board are always dead.
    '''
    Sa = np.pad(S, 1, mode="wrap" if wrap else "constant")
    Ss = (Sa[:-2, :-2] + Sa[:-2, 1:-1] + Sa[:-2, 2:]
          + Sa[1:-1, :-2] + Sa[1:-1, 2:]
          + Sa[2:, :-2] + Sa[2:, 1:-1] + Sa[2:, 2:])
    return ((Ss == 3) | ((Ss == 2) & (S == 1))).astype(np.uint8)


def random_grid(s, density, seed=None):
    rng = np.random.default_rng(seed)
    return (rng.random((s, s)) < density).astype(np.uint8)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--size", type=int, default=512)
    parser.add_argument("--density", type=float, default=0.3)
    parser.add_argument("--no-wrap", dest="wrap", action="store_false")
    parser.add_argument("--gens", type=int, default=200)
    parser.add_argument("--seed", type=int, default=None)
    args = parser.parse_args()

    S = random_grid(args.size, args.density, args.seed)
    t0 = perf_counter()
    for _ in range(args.gens):
        S = step(S, args.wrap)
    dt = perf_counter() - t0
    cells = args.size * args.size * args.gens
    print(f"{args.gens} generations of {args.size}x{args.size} in {dt:.2f} s: "
          f"{args.gens / dt:.1f} gen/s, {cells / dt / 1e6:.1f} Mcells/s, "
          f"population {int(S.sum())}")


if __name__ == "__main__":
    main()
