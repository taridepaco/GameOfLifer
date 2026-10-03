% Game of life
% side=101;
% min_al=side*.6;
% S=randi(side,side)<min_al;
% Sn=zeros(side,side);
% spy(S)
% pause(2)
%% loop method
% while 1
%     tic
%    for i=1:side
%        for j=1:side
%            if S(i,j)==1
%            switch sum(sum(S(max(i-1,1):min(i+1,side),max(j-1,1):min(j+1,side))))-1
%                case {0,1}
%                    Sn(i,j)=0;
%                case {2,3}
%                    Sn(i,j)=1;
%                case {4,5,6,7,8}
%                    Sn(i,j)=0;
%            end
%            else
%                if sum(sum(S(max(i-1,1):min(i+1,side),max(j-1,1):min(j+1,side)))) ==3
%                    Sn(i,j)=1;
%                else
%                    Sn(i,j)=0;
%                end
%            end
%            
%        end
%    end
%    S=Sn;
%    Sn=zeros(side,side);
%    toc
% %    pause(0.1)
%    spy(S)
% end

%vector method
clear;clc
side=501;
S=zeros(side,side);
min_al=side*.6;
S=randi(side,side)<min_al;
% S(2:2:end,:)=1;
% S(:,1:2)=0;S(:,end-1:end)=0;
% S(3:4:end-2,2)=1;S(3:4:end-2,end-1)=1;
Sn=zeros(side,side);
% S(round(side/2),round(side/2))=~S(round(side/2),round(side/2));
% S(250,250)=0;
spy(S)
while 1
   Ss=S(1:end-2,1:end-2)+S(1:end-2,2:end-1)+S(1:end-2,3:end)+S(2:end-1,1:end-2)+S(2:end-1,3:end)+ S(3:end,1:end-2)+  S(3:end,2:end-1)+  S(3:end,3:end);
   Sn(2:end-1,2:end-1)=S(2:end-1,2:end-1).*(Ss==2)+S(2:end-1,2:end-1).*(Ss==3)+(~S(2:end-1,2:end-1)).*(Ss==3);
   S=Sn;
   Sn=zeros(side,side);
%    S(randi(side),randi(side))=1; %bombardeo de vida aleatorio
   pause(0.00001)
   spy(S)
end
    
    
    
    
    
    
    
    
    
    
    
    

