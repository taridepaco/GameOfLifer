'''

Conway's game of life

'''
import numpy as np
import matplotlib.pyplot as plt
from time import sleep

def main(s=20,l=0.7,inf=True):
    # S = (np.random.rand(s,s)<l).astype(int)
    S = np.zeros((s,s)).astype(int)
    S[10,5:9] = 1
    S[9,8] = 1
    S[8,8] = 1
    S[7,7] = 1
    S[9,4] = 1
    S[7,4] = 1
    # print(S)
    for _ in range(2000):
        if inf:
            Sa = np.zeros((s+2,s+2)).astype(int)
            Sa[1:-1,1:-1] = S
            Sa[0,1:-1] = S[-1,:]
            Sa[-1,1:-1] = S[0,:]
            Sa[1:-1,0] = S[:,-1]
            Sa[1:-1,-1] = S[:,0]
            Sa[0,0] = S[-1,-1]
            Sa[0,-1] = S[-1,0]
            Sa[-1,0] = S[0,-1]
            Sa[-1,-1] = S[0,0]
            Ss = Sa[:-2,:-2]  + Sa[:-2,1:-1] + Sa[:-2,2:] + Sa[1:-1,:-2] + Sa[1:-1,2:] + Sa[2:,:-2]   + Sa[2:,1:-1]  + Sa[2:,2:]
            S = (Ss == 3) + (Ss == 2)*S
        else:
            Sa = S
            Ss = Sa[:-2,:-2]  + Sa[:-2,1:-1] + Sa[:-2,2:] + Sa[1:-1,:-2] + Sa[1:-1,2:] + Sa[2:,:-2]   + Sa[2:,1:-1]  + Sa[2:,2:]
            S[1:-1,1:-1] = (Ss == 3) + (Ss == 2)*S[1:-1,1:-1]
        del(Sa,Ss)
        plt.spy(S)
        plt.show(block=False)
        plt.pause(0.00000000000001)
        plt.clf()
    print('heello')


    


if __name__ == "__main__":
    main()