import numpy as np

from GameOfLife_main import step


def grid(s, cells):
    S = np.zeros((s, s), dtype=np.uint8)
    for r, c in cells:
        S[r, c] = 1
    return S


GLIDER = [(0, 1), (1, 2), (2, 0), (2, 1), (2, 2)]


def test_blinker_period_2():
    S = grid(5, [(2, 1), (2, 2), (2, 3)])
    S1 = step(S)
    assert (S1 == grid(5, [(1, 2), (2, 2), (3, 2)])).all()
    assert (step(S1) == S).all()


def test_block_is_still():
    S = grid(6, [(2, 2), (2, 3), (3, 2), (3, 3)])
    assert (step(S) == S).all()
    assert (step(S, wrap=False) == S).all()


def test_glider_moves_on_torus():
    S = grid(8, GLIDER)
    for _ in range(4):
        S = step(S)
    assert (S == np.roll(grid(8, GLIDER), (1, 1), axis=(0, 1))).all()
    # wraps around the corner after enough generations
    S = grid(8, GLIDER)
    for _ in range(32):
        S = step(S)
    assert (S == grid(8, GLIDER)).all()


def test_border_cells_die_without_wrap():
    # A blinker on the edge: with wrap=False the half outside is missing,
    # so the edge cells must update (not stay frozen).
    S = grid(5, [(0, 0), (0, 1), (0, 2)])
    S1 = step(S, wrap=False)
    assert (S1 == grid(5, [(0, 1), (1, 1)])).all()


def test_dead_board_stays_dead():
    S = np.zeros((10, 10), dtype=np.uint8)
    assert step(S).sum() == 0
